using Microsoft.EntityFrameworkCore;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Entities;
using PosApi.DTOs.Users;
using PosApi.Services.Interfaces;

namespace PosApi.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db) => _db = db;

    public async Task<List<UserDto>> GetAllAsync()
    {
        return await _db.Users
            .Include(u => u.Role)
            .OrderBy(u => u.FullName)
            .Select(u => ToDto(u))
            .ToListAsync();
    }

    public async Task<UserDto> GetByIdAsync(int id)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new NotFoundException("Usuario", id);

        return ToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request)
    {
        // Verificar username único
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            throw new BusinessException($"El username '{request.Username}' ya está en uso.");

        // Verificar que el rol existe
        if (!await _db.Roles.AnyAsync(r => r.Id == request.RoleId))
            throw new NotFoundException("Rol", request.RoleId);

        var user = new User
        {
            FullName     = request.FullName.Trim(),
            Username     = request.Username.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            RoleId       = request.RoleId,
            Active       = true,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new NotFoundException("Usuario", id);

        // Verificar username único (ignorando el mismo usuario)
        if (await _db.Users.AnyAsync(u => u.Username == request.Username && u.Id != id))
            throw new BusinessException($"El username '{request.Username}' ya está en uso.");

        if (!await _db.Roles.AnyAsync(r => r.Id == request.RoleId))
            throw new NotFoundException("Rol", request.RoleId);

        user.FullName  = request.FullName.Trim();
        user.Username  = request.Username.Trim().ToLower();
        user.RoleId    = request.RoleId;
        user.UpdatedAt = DateTime.UtcNow;

        // Solo cambiar contraseña si se envió una nueva
        if (!string.IsNullOrWhiteSpace(request.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        await _db.SaveChangesAsync();
        return await GetByIdAsync(user.Id);
    }

    public async Task ActivateAsync(int id)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new NotFoundException("Usuario", id);

        user.Active    = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task DeactivateAsync(int id)
    {
        var user = await _db.Users.FindAsync(id)
            ?? throw new NotFoundException("Usuario", id);

        user.Active    = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    // ── Mapper manual ─────────────────────────────────────────
    private static UserDto ToDto(User u) => new()
    {
        Id        = u.Id,
        FullName  = u.FullName,
        Username  = u.Username,
        RoleId    = u.RoleId,
        RoleName  = u.Role.Name,
        Active    = u.Active,
        CreatedAt = u.CreatedAt
    };
}