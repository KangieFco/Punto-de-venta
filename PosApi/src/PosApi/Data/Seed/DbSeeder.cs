using PosApi.Domain.Entities;

namespace PosApi.Data.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await SeedRolesAsync(db);
        await SeedAdminUserAsync(db);
    }

    private static async Task SeedRolesAsync(AppDbContext db)
    {
        if (db.Roles.Any()) return;

        var roles = new List<Role>
        {
            new() { Name = "Admin",      Description = "Acceso total al sistema" },
            new() { Name = "Cajero",     Description = "Acceso a punto de venta" },
            new() { Name = "Inventario", Description = "Gestión de productos e inventario" },
            new() { Name = "Supervisor", Description = "Supervisión de ventas y caja" }
        };

        db.Roles.AddRange(roles);
        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminUserAsync(AppDbContext db)
    {
        if (db.Users.Any()) return;

        var adminRole = db.Roles.First(r => r.Name == "Admin");

        var admin = new User
        {
            FullName     = "Administrador",
            Username     = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin1234!"),
            RoleId       = adminRole.Id,
            Active       = true,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };

        db.Users.Add(admin);
        await db.SaveChangesAsync();

        Console.WriteLine("✅ Usuario admin creado — usuario: admin | contraseña: Admin1234!");
    }
}