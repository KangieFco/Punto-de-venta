using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.Users;

public class CreateUserRequest
{
    [Required, MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string Username { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public int RoleId { get; set; }
}