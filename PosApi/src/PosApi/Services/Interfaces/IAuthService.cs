using PosApi.DTOs.Auth;

namespace PosApi.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserSessionDto> GetCurrentUserAsync(int userId);
}