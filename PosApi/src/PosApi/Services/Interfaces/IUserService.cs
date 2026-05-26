using PosApi.DTOs.Users;

namespace PosApi.Services.Interfaces;

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync();
    Task<UserDto> GetByIdAsync(int id);
    Task<UserDto> CreateAsync(CreateUserRequest request);
    Task<UserDto> UpdateAsync(int id, UpdateUserRequest request);
    Task ActivateAsync(int id);
    Task DeactivateAsync(int id);
}