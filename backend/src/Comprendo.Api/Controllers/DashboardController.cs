using Comprendo.Application.Features.Dashboard;
using Comprendo.Application.Features.Dashboard.GetDashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Comprendo.Api.Controllers;

/// <summary>Resumen del panel del docente autenticado.</summary>
[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "DOCENTE")]
public class DashboardController(ISender sender) : ControllerBase
{
    /// <summary>Obtiene métricas del dashboard del docente.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(DashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardDto>> Get(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDashboardQuery(), cancellationToken);
        return Ok(result);
    }
}
