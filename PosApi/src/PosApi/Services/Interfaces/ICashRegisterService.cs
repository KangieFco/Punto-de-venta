using PosApi.DTOs.CashRegisters;

namespace PosApi.Services.Interfaces;

public interface ICashRegisterService
{
    Task<CashRegisterDto> OpenAsync(OpenCashRegisterRequest request, int userId);
    Task<CashRegisterDto> CloseAsync(int id, CloseCashRegisterRequest request, int userId);
    Task<CashRegisterDto?> GetCurrentOpenAsync(int userId);
    Task<CashRegisterDto> GetByIdAsync(int id);
    Task<List<CashRegisterDto>> GetAllAsync();
    Task<CashMovementDto> AddIncomingAsync(CashMovementRequest request, int userId);
    Task<CashMovementDto> AddOutgoingAsync(CashMovementRequest request, int userId);
    Task<List<CashMovementDto>> GetMovementsAsync(int cashRegisterId);

    // Uso interno: verificar caja abierta del usuario
    Task<int> GetOpenRegisterIdAsync(int userId);
}