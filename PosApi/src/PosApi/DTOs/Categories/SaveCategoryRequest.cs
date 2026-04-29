using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.Categories;

public class SaveCategoryRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Description { get; set; }
}