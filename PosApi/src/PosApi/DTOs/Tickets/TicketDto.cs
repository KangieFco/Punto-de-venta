namespace PosApi.DTOs.Tickets;

public class TicketDto
{
    public int      Id            { get; set; }
    public int      SaleId        { get; set; }
    public string   Folio         { get; set; } = string.Empty;
    public int      PrintedCount  { get; set; }
    public DateTime? LastPrintedAt { get; set; }
    public DateTime CreatedAt     { get; set; }
    public string?  TicketText    { get; set; }  // Texto plano ESC/POS
}