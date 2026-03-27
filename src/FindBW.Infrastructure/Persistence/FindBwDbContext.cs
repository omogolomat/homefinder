using FindBW.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FindBW.Infrastructure.Persistence;

public class FindBwDbContext : DbContext
{
    public FindBwDbContext(DbContextOptions<FindBwDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<AgentSubscription> AgentSubscriptions => Set<AgentSubscription>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Email).IsUnique();
            b.Property(x => x.Email).HasMaxLength(256);
            b.Property(x => x.PhoneNumber).HasMaxLength(32);
            b.Property(x => x.FullName).HasMaxLength(256);
        });

        modelBuilder.Entity<Listing>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(512);
            b.Property(x => x.Suburb).HasMaxLength(256);
            b.Property(x => x.PriceBwp).HasPrecision(18, 2);
            b.HasIndex(x => new { x.City, x.Status });
            b.HasIndex(x => new { x.Latitude, x.Longitude })
                .HasDatabaseName("IX_Listings_LatLng")
                .HasFilter("[Latitude] IS NOT NULL AND [Longitude] IS NOT NULL");
            b.HasOne(x => x.Agent)
                .WithMany(x => x.Listings)
                .HasForeignKey(x => x.AgentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ListingImage>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Url).HasMaxLength(2048);
            b.HasOne(x => x.Listing)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Favorite>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.UserId, x.ListingId }).IsUnique();
            b.HasOne(x => x.User)
                .WithMany(x => x.Favorites)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Listing)
                .WithMany(x => x.Favorites)
                .HasForeignKey(x => x.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AgentSubscription>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.PlanName).HasMaxLength(128);
            b.HasOne(x => x.Agent)
                .WithMany(x => x.AgentSubscriptions)
                .HasForeignKey(x => x.AgentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PaymentTransaction>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.AmountBwp).HasPrecision(18, 2);
            b.Property(x => x.ExternalReference).HasMaxLength(256);
            b.Property(x => x.Purpose).HasMaxLength(256);
            b.HasOne(x => x.User)
                .WithMany(x => x.PaymentTransactions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
