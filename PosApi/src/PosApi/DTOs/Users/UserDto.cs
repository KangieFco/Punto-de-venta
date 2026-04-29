namespace PosApi.DTOs.Users;

public class UserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}