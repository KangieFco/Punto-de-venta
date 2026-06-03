using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLayawaysWithPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SaleId",
                table: "Layaways",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LayawayPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LayawayId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LayawayPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LayawayPayments_Layaways_LayawayId",
                        column: x => x.LayawayId,
                        principalTable: "Layaways",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LayawayPayments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Layaways_SaleId",
                table: "Layaways",
                column: "SaleId");

            migrationBuilder.CreateIndex(
                name: "IX_LayawayPayments_LayawayId",
                table: "LayawayPayments",
                column: "LayawayId");

            migrationBuilder.CreateIndex(
                name: "IX_LayawayPayments_UserId",
                table: "LayawayPayments",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Layaways_Sales_SaleId",
                table: "Layaways",
                column: "SaleId",
                principalTable: "Sales",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Layaways_Sales_SaleId",
                table: "Layaways");

            migrationBuilder.DropTable(
                name: "LayawayPayments");

            migrationBuilder.DropIndex(
                name: "IX_Layaways_SaleId",
                table: "Layaways");

            migrationBuilder.DropColumn(
                name: "SaleId",
                table: "Layaways");
        }
    }
}
