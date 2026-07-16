using Microsoft.EntityFrameworkCore;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Enums;
using PosApi.Common;
using PosApi.DTOs.Tickets;
using PosApi.Services.Interfaces;
using System.Text;

namespace PosApi.Services;

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public TicketService(AppDbContext db, IConfiguration config)
    {
        _db     = db;
        _config = config;
    }

    public async Task<TicketDto> GetBySaleIdAsync(int saleId)
    {
        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(t => t.SaleId == saleId)
            ?? throw new NotFoundException(
                "Ticket para la venta", saleId);

        return ToDto(ticket);
    }

    public async Task<TicketDto> GetByFolioAsync(string folio)
    {
        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(t => t.Folio == folio)
            ?? throw new NotFoundException($"Ticket con folio '{folio}' no encontrado.");

        return ToDto(ticket);
    }

    public async Task<TicketDto> PrintAsync(int id, int userId)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Sale)               
                .ThenInclude(s => s.User)
            .Include(t => t.Sale)
                .ThenInclude(s => s.SaleDetails)
                    .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new NotFoundException("Ticket", id);

        ticket.PrintedCount++;
        ticket.LastPrintedAt = DateTimeHelper.Now;
        await _db.SaveChangesAsync();

        var text     = await GenerateTextAsync(ticket.SaleId);
        var dto      = ToDto(ticket);
        dto.TicketText = text;
        return dto;
    }

    public async Task<TicketDto> ReprintAsync(int id, int userId)
    {
        // Solo Admin o Supervisor puede reimprimir (validado en controller)
        return await PrintAsync(id, userId);
    }

    // ── Generar texto plano compatible ESC/POS ────────────────
    public async Task<string> GenerateTextAsync(int saleId)
        {
            var sale = await _db.Sales
                .Include(s => s.User)
                .Include(s => s.SaleDetails)
                    .ThenInclude(d => d.Product)
                .FirstOrDefaultAsync(s => s.Id == saleId)
                ?? throw new NotFoundException("Venta", saleId);

            var storeName  = _config["Store:Name"]    ?? "Mineros de Parral Oficial";
            var storeAddr  = _config["Store:Address"] ?? "";
            var storePhone = _config["Store:Phone"]   ?? "";
            var storeMsg   = _config["Store:Footer"]  ?? "¡Gracias por su compra!";
            var width      = 32;

            var sb = new StringBuilder();

            // ── Encabezado ────────────────────────────────────────────
            sb.AppendLine(Center(storeName, width));
            if (!string.IsNullOrWhiteSpace(storeAddr))
                sb.AppendLine(Center(storeAddr, width));
            if (!string.IsNullOrWhiteSpace(storePhone))
                sb.AppendLine(Center(storePhone, width));
            sb.AppendLine(Line('-', width));

            sb.AppendLine($"Folio  : {sale.Folio}");
            sb.AppendLine($"Fecha  : {sale.CreatedAt:dd/MM/yyyy HH:mm}");
            sb.AppendLine($"Cajero : {sale.User.FullName}");
            sb.AppendLine(Line('-', width));

            sb.AppendLine(ColLine("PRODUCTO", "IMPORTE", width));
            sb.AppendLine(Line('-', width));

            foreach (var d in sale.SaleDetails)
            {
                var name    = Truncate(d.Product.Name, width - 10);
                var qtyLine = $"  {d.Quantity} x ${d.UnitPrice:F2}";
                sb.AppendLine(name);
                sb.AppendLine(ColLine(qtyLine, $"${d.Subtotal:F2}", width));
            }

            sb.AppendLine(Line('-', width));

            if (sale.Discount > 0)
                sb.AppendLine(ColLine("Descuento:", $"-${sale.Discount:F2}", width));

            sb.AppendLine(ColLine("TOTAL:", $"${sale.Total:F2}", width));

            // ── Método de pago ────────────────────────────────────────
            if (sale.PaymentMethod == PaymentMethod.Mixed &&
                !string.IsNullOrWhiteSpace(sale.PaymentBreakdown))
            {
                sb.AppendLine(ColLine("Pago:", "Mixto", width));
                foreach (var part in sale.PaymentBreakdown.Split(','))
                {
                    var lastColon = part.LastIndexOf(':');
                    if (lastColon <= 0) continue;
                    var method    = part[..lastColon].Trim();
                    var amountStr = part[(lastColon + 1)..].Trim();
                    if (decimal.TryParse(amountStr,
                            System.Globalization.NumberStyles.Any,
                            System.Globalization.CultureInfo.InvariantCulture,
                            out var amount))
                    {
                        var label = method switch
                        {
                            "Cash"   => "  Efectivo",
                            "Card"   => "  Tarjeta",
                            "Dollar" => "  Dolares",
                            _        => $"  {method}"
                        };
                        sb.AppendLine(ColLine(label, $"${amount:F2}", width));
                    }
                }
            }
            else
            {
                var methodLabel = sale.PaymentMethod switch
                {
                    PaymentMethod.Cash   => "Efectivo",
                    PaymentMethod.Card   => "Tarjeta",
                    PaymentMethod.Dollar => "Dolares USD",
                    PaymentMethod.Other  => "Otro",
                    _                    => sale.PaymentMethod.ToString()
                };
                sb.AppendLine(ColLine($"Pago ({methodLabel}):", $"${sale.AmountReceived:F2}", width));
            }

            if (sale.ChangeAmount > 0)
                sb.AppendLine(ColLine("Cambio:", $"${sale.ChangeAmount:F2}", width));

            sb.AppendLine(Line('=', width));
            foreach (var line in storeMsg.Split('\n')) { sb.AppendLine(Center(line.Trim(), width));}
            sb.AppendLine();
            sb.AppendLine();
            sb.AppendLine();
            sb.AppendLine();
            sb.AppendLine();
            sb.AppendLine();

            return sb.ToString();
        }

    // ── Helpers de formato ────────────────────────────────────

    private static string Center(string text, int width)
    {
        if (text.Length >= width) return text;
        var pad = (width - text.Length) / 2;
        return text.PadLeft(text.Length + pad).PadRight(width);
    }

    private static string Line(char ch, int width)
        => new string(ch, width);

    private static string ColLine(string left, string right, int width)
    {
        var space = width - left.Length - right.Length;
        if (space < 1) space = 1;
        return left + new string(' ', space) + right;
    }

    private static string Truncate(string text, int max)
        => text.Length > max ? text[..max] : text;

    private static TicketDto ToDto(Domain.Entities.Ticket t) => new()
    {
        Id = t.Id,
        SaleId  = t.SaleId,
        Folio = t.Folio,
        PrintedCount = t.PrintedCount,
        LastPrintedAt = t.LastPrintedAt,
        CreatedAt = t.CreatedAt
    };
}