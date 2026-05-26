using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.DTOs.Auth;
using PosApi.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PosApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // Buscar usuario activo con su rol
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user is null || !user.Active)
            throw new UnauthorizedException("Usuario o contraseña incorrectos.");

        // Verificar contraseña
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Usuario o contraseña incorrectos.");

        var token = GenerateToken(user.Id, user.Username, user.Role.Name);

        return new LoginResponse
        {
            Token = token,
            User = new UserSessionDto
            {
                Id       = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                Role     = user.Role.Name
            }
        };
    }

    public async Task<UserSessionDto> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active)
            ?? throw new NotFoundException("Usuario", userId);

        return new UserSessionDto
        {
            Id       = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            Role     = user.Role.Name
        };
    }

    // ── Generar JWT ───────────────────────────────────────────
    private string GenerateToken(int userId, string username, string role)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(
                          double.Parse(_config["Jwt:ExpiresInHours"] ?? "8"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:             _config["Jwt:Issuer"],
            audience:           _config["Jwt:Audience"],
            claims:             claims,
            expires:            expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}