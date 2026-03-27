using FindBW.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FindBW.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteService _favorites;

    public FavoritesController(IFavoriteService favorites)
    {
        _favorites = favorites;
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userId = UserId();
        if (userId is null)
            return Unauthorized();

        var ids = await _favorites.GetListingIdsAsync(userId.Value, cancellationToken);
        return Ok(new { listingIds = ids });
    }

    [HttpPost("{listingId:guid}")]
    public async Task<IActionResult> Add(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = UserId();
        if (userId is null)
            return Unauthorized();

        var ok = await _favorites.AddAsync(userId.Value, listingId, cancellationToken);
        if (!ok)
            return NotFound();
        return NoContent();
    }

    [HttpDelete("{listingId:guid}")]
    public async Task<IActionResult> Remove(Guid listingId, CancellationToken cancellationToken)
    {
        var userId = UserId();
        if (userId is null)
            return Unauthorized();

        await _favorites.RemoveAsync(userId.Value, listingId, cancellationToken);
        return NoContent();
    }

    private Guid? UserId()
    {
        var v = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(v, out var id) ? id : null;
    }
}
