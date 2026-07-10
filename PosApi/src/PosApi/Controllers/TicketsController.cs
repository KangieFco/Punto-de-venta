using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Tickets;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly ICurrentUserService _currentUser;

    public TicketsController(
        ITicketService ticketService,
        ICurrentUserService currentUser)
    {
        _ticketService = ticketService;
        _currentUser = currentUser;
    }

    // GET /api/tickets/sale/{saleId}
    [HttpGet("sale/{saleId:int}")]
    public async Task<IActionResult> GetBySale(int saleId)
    {
        var ticket = await _ticketService.GetBySaleIdAsync(saleId);

        return Ok(
            ApiResponse<TicketDto>.Ok(
                ticket,
                "Ticket obtenido correctamente."
            )
        );
    }

    // GET /api/tickets/folio/{folio}
    [HttpGet("folio/{folio}")]
    public async Task<IActionResult> GetByFolio(string folio)
    {
        var ticket = await _ticketService.GetByFolioAsync(folio);

        return Ok(
            ApiResponse<TicketDto>.Ok(
                ticket,
                "Ticket obtenido correctamente."
            )
        );
    }

    // POST /api/tickets/{id}/print
    [HttpPost("{id:int}/print")]
    [Authorize(Roles = "Admin,Cajero,Supervisor")]
    public async Task<IActionResult> Print(int id)
    {
        var ticket = await _ticketService.PrintAsync(
            id,
            _currentUser.UserId
        );

        return Ok(
            ApiResponse<TicketDto>.Ok(
                ticket,
                "Ticket generado correctamente."
            )
        );
    }

    // POST /api/tickets/{id}/reprint
    [HttpPost("{id:int}/reprint")]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<IActionResult> Reprint(int id)
    {
        var ticket = await _ticketService.ReprintAsync(
            id,
            _currentUser.UserId
        );

        return Ok(
            ApiResponse<TicketDto>.Ok(
                ticket,
                "Ticket generado para reimpresión."
            )
        );
    }
}