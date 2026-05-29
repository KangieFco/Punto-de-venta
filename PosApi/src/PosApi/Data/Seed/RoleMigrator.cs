namespace PosApi.Data.Seed;
public static class RoleMigrator
{
    public static async Task AddMissingRolesAsync(AppDbContext db)
    {
        var existing = db.Roles.Select(r => r.Name).ToList();

        var missing = new Dictionary<string, string>
        {
            { "Cajero", "Entradas de inventario, ventas y reportes" }
        };

        foreach (var (name, desc) in missing)
        {
            if (!existing.Contains(name))
            {
                db.Roles.Add(new Domain.Entities.Role
                {
                    Name        = name,
                    Description = desc
                });
            }
        }

        await db.SaveChangesAsync();
    }
}