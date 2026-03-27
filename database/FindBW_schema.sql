-- FindBW reference schema notes (aligns with EF Core migrations).
-- Run migrations from the API project for authoritative DDL: dotnet ef database update

-- Optional: full-text search (requires SQL Server full-text component)
/*
CREATE FULLTEXT CATALOG ftFindBW AS DEFAULT;

CREATE FULLTEXT INDEX ON dbo.Listings(Title, City, Suburb)
KEY INDEX PK_Listings
WITH STOPLIST = SYSTEM;
*/

-- Optional: spatial index on lat/lng (after columns exist)
/*
CREATE NONCLUSTERED INDEX IX_Listings_Geo
ON dbo.Listings(Latitude, Longitude)
WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL;
*/
