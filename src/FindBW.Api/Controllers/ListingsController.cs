using FindBW.Application.Abstractions;
using FindBW.Application.DTOs.Listings;
using FindBW.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FindBW.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController : ControllerBase
{
    private readonly IListingService _listings;

    public ListingsController(IListingService listings)
    {
        _listings = listings;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] BotswanaCity? city,
        [FromQuery] ListingType? listingType,
        [FromQuery] PropertyType? propertyType,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var result = await _listings.SearchAsync(new SearchListingsQuery
        {
            Q = q,
            City = city,
            ListingType = listingType,
            PropertyType = propertyType,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Page = page,
            PageSize = pageSize
        }, cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var listing = await _listings.GetByIdAsync(id, cancellationToken);
        if (listing is null)
            return NotFound();
        return Ok(listing);
    }

    [HttpPost]
    [Authorize(Roles = "Agent,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateListingRequest request, CancellationToken cancellationToken)
    {
        var userId = UserId();
        if (userId is null)
            return Unauthorized();

        var id = await _listings.CreateAsync(userId.Value, request, cancellationToken);
        if (id is null)
            return BadRequest();
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    private Guid? UserId()
    {
        var v = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(v, out var id) ? id : null;
    }
}
