using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.Users;

public class UpdateUserRequest
{
    [Required, MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(60)]
    public string Username { get; set; } = string.Empty;

    public string? Password { get; set; }  // Null = no cambiar

    [Required]
    public int RoleId { get; set; }
}