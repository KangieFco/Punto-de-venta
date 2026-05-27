using PosApi.DTOs.Tickets;

namespace PosApi.Services.Interfaces;

public interface ITicketService
{
    Task<TicketDto> GetBySaleIdAsync(int saleId);
    Task<TicketDto> GetByFolioAsync(string folio);
    Task<TicketDto> PrintAsync(int id, int userId);
    Task<TicketDto> ReprintAsync(int id, int userId);
    Task<string> GenerateTextAsync(int saleId);
}