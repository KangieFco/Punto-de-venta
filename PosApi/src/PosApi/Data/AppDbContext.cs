using Microsoft.EntityFrameworkCore;
using PosApi.Domain.Entities;

namespace PosApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleDetail> SaleDetails => Set<SaleDetail>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<CashRegister> CashRegisters => Set<CashRegister>();
    public DbSet<CashMovement> CashMovements => Set<CashMovement>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Roles ─────────────────────────────────────────────
        modelBuilder.Entity<Role>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Name).IsRequired().HasMaxLength(50);
            e.HasIndex(r => r.Name).IsUnique();
        });

        // ── Users ─────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.FullName).IsRequired().HasMaxLength(120);
            e.Property(u => u.Username).IsRequired().HasMaxLength(60);
            e.Property(u => u.PasswordHash).IsRequired();
            e.HasIndex(u => u.Username).IsUnique();

            e.HasOne(u => u.Role)
             .WithMany(r => r.Users)
             .HasForeignKey(u => u.RoleId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Categories ────────────────────────────────────────
        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).IsRequired().HasMaxLength(100);
        });

        // ── Products ──────────────────────────────────────────
        modelBuilder.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Code).IsRequired().HasMaxLength(50);
            e.Property(p => p.Barcode).HasMaxLength(100);
            e.Property(p => p.Name).IsRequired().HasMaxLength(150);
            e.Property(p => p.Unit).HasMaxLength(20);
            e.Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
            e.Property(p => p.SalePrice).HasColumnType("decimal(18,2)");
            e.HasIndex(p => p.Code).IsUnique();
            e.HasIndex(p => p.Barcode);

            e.HasOne(p => p.Category)
             .WithMany(c => c.Products)
             .HasForeignKey(p => p.CategoryId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Sales ─────────────────────────────────────────────
        modelBuilder.Entity<Sale>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Folio).IsRequired().HasMaxLength(20);
            e.Property(s => s.Subtotal).HasColumnType("decimal(18,2)");
            e.Property(s => s.Discount).HasColumnType("decimal(18,2)");
            e.Property(s => s.Tax).HasColumnType("decimal(18,2)");
            e.Property(s => s.Total).HasColumnType("decimal(18,2)");
            e.Property(s => s.AmountReceived).HasColumnType("decimal(18,2)");
            e.Property(s => s.ChangeAmount).HasColumnType("decimal(18,2)");
            e.HasIndex(s => s.Folio).IsUnique();

            e.HasOne(s => s.User)
             .WithMany(u => u.Sales)
             .HasForeignKey(s => s.UserId)
             .OnDelete(DeleteBehavior.Restrict);

            // Self-ref para cancelación — sin cascade
            e.HasOne(s => s.CancelledByUser)
             .WithMany()
             .HasForeignKey(s => s.CancelledByUserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(s => s.CashRegister)
             .WithMany(cr => cr.Sales)
             .HasForeignKey(s => s.CashRegisterId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── SaleDetails ───────────────────────────────────────
        modelBuilder.Entity<SaleDetail>(e =>
        {
            e.HasKey(sd => sd.Id);
            e.Property(sd => sd.UnitPrice).HasColumnType("decimal(18,2)");
            e.Property(sd => sd.Discount).HasColumnType("decimal(18,2)");
            e.Property(sd => sd.Subtotal).HasColumnType("decimal(18,2)");

            e.HasOne(sd => sd.Sale)
             .WithMany(s => s.SaleDetails)
             .HasForeignKey(sd => sd.SaleId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(sd => sd.Product)
             .WithMany(p => p.SaleDetails)
             .HasForeignKey(sd => sd.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── InventoryMovements ────────────────────────────────
        modelBuilder.Entity<InventoryMovement>(e =>
        {
            e.HasKey(im => im.Id);
            e.Property(im => im.Reason).HasMaxLength(200);
            e.Property(im => im.Reference).HasMaxLength(50);

            e.HasOne(im => im.Product)
             .WithMany(p => p.InventoryMovements)
             .HasForeignKey(im => im.ProductId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(im => im.User)
             .WithMany(u => u.InventoryMovements)
             .HasForeignKey(im => im.UserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── CashRegisters ─────────────────────────────────────
        modelBuilder.Entity<CashRegister>(e =>
        {
            e.HasKey(cr => cr.Id);
            e.Property(cr => cr.OpeningAmount).HasColumnType("decimal(18,2)");
            e.Property(cr => cr.ClosingAmount).HasColumnType("decimal(18,2)");
            e.Property(cr => cr.ExpectedAmount).HasColumnType("decimal(18,2)");
            e.Property(cr => cr.Difference).HasColumnType("decimal(18,2)");

            e.HasOne(cr => cr.User)
             .WithMany(u => u.CashRegisters)
             .HasForeignKey(cr => cr.UserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── CashMovements ─────────────────────────────────────
        modelBuilder.Entity<CashMovement>(e =>
        {
            e.HasKey(cm => cm.Id);
            e.Property(cm => cm.Amount).HasColumnType("decimal(18,2)");
            e.Property(cm => cm.Reason).HasMaxLength(200);

            e.HasOne(cm => cm.CashRegister)
             .WithMany(cr => cr.CashMovements)
             .HasForeignKey(cm => cm.CashRegisterId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(cm => cm.User)
             .WithMany(u => u.CashMovements)
             .HasForeignKey(cm => cm.UserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Tickets ───────────────────────────────────────────
        modelBuilder.Entity<Ticket>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.Folio).IsRequired().HasMaxLength(20);

            e.HasOne(t => t.Sale)
             .WithOne(s => s.Ticket)
             .HasForeignKey<Ticket>(t => t.SaleId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}