namespace PosApi.Domain.Entities;

public class Ticket
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public string Folio { get; set; } = string.Empty;
    public int PrintedCount { get; set; } = 0;
    public DateTime? LastPrintedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public Sale Sale { get; set; } = null!;
}