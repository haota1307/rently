-- Advanced Database Indexes - No New Tables Required
-- Performance Optimization cho Rently Recommendation System
-- Execute với: psql -d rently -f advanced-indexes.sql

-- 1. Composite indexes cho Room optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_rental_available_price 
ON "Room" ("rentalId", "isAvailable", "price") 
WHERE "isAvailable" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_area_price_available
ON "Room" ("area", "price", "isAvailable")
WHERE "isAvailable" = true;

-- 2. Collaborative filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorite_rental_user_time
ON "Favorite" ("rentalId", "userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_viewing_post_tenant_time  
ON "ViewingSchedule" ("postId", "tenantId", "createdAt" DESC)
WHERE "status" != 'CANCELLED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_request_post_tenant_time
ON "RentalRequest" ("postId", "tenantId", "createdAt" DESC)
WHERE "status" != 'REJECTED';

-- 3. Location-based search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rental_coordinates_covering
ON "Rental" ("lat", "lng") 
INCLUDE ("id", "title", "address", "createdAt")
WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL;

-- 4. Covering indexes để giảm I/O
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_details_covering
ON "Room" ("id") 
INCLUDE ("title", "price", "area", "isAvailable", "rentalId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rental_location_covering
ON "Rental" ("id")
INCLUDE ("title", "address", "lat", "lng", "createdAt", "landlordId");

-- 5. RentalPost optimization cho active listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentalpost_room_active_end
ON "RentalPost" ("roomId", "status", "endDate")
WHERE "status" = 'ACTIVE';

-- 6. Image optimization cho fast loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rental_image_order_limit
ON "RentalImage" ("rentalId", "order")
WHERE "order" <= 3;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_image_order_limit
ON "RoomImage" ("roomId", "order") 
WHERE "order" <= 3;

-- 7. Amenity matching optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_amenity_covering
ON "RoomAmenity" ("roomId") 
INCLUDE ("amenityId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_amenity_name_search
ON "Amenity" ("name") 
WHERE LENGTH("name") > 0;

-- 8. User activity optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_status_active
ON "User" ("roleId", "status", "createdAt")
WHERE "status" = 'ACTIVE';

-- 9. Popularity calculation optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorite_rental_recent
ON "Favorite" ("rentalId", "createdAt")
WHERE "createdAt" >= (CURRENT_DATE - INTERVAL '6 months');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_viewing_room_recent
ON "ViewingSchedule" ("createdAt", "status")
WHERE "createdAt" >= (CURRENT_DATE - INTERVAL '3 months') 
  AND "status" != 'CANCELLED';

-- 10. Partial indexes cho recent data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_recent_available
ON "Room" ("createdAt", "price", "area")
WHERE "isAvailable" = true 
  AND "createdAt" >= (CURRENT_DATE - INTERVAL '1 year');

-- 11. Multi-column statistics cho better query planning
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_statistic_ext 
    WHERE stxname = 'room_price_area_stats'
  ) THEN
    CREATE STATISTICS room_price_area_stats 
    ON price, area, "isAvailable" 
    FROM "Room";
  END IF;
END $$;

-- 12. GIN indexes cho array/JSON operations (if any)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_room_search_vector
ON "Room" USING gin(to_tsvector('english', title || ' ' || COALESCE((SELECT address FROM "Rental" WHERE id = "Room"."rentalId"), '')));

-- Show index creation progress
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  AND indexname NOT LIKE 'idx_room_available%' -- Exclude existing ones
ORDER BY tablename, indexname;

-- Analyze tables for better statistics
ANALYZE "Room";
ANALYZE "Rental"; 
ANALYZE "RentalPost";
ANALYZE "Favorite";
ANALYZE "ViewingSchedule";
ANALYZE "RentalRequest";

EXPLAIN (ANALYZE, BUFFERS) 
SELECT r.*, rental.lat, rental.lng
FROM "Room" r
INNER JOIN "Rental" rental ON r."rentalId" = rental.id
WHERE r."isAvailable" = true
  AND r.price BETWEEN 2000000 AND 5000000
  AND rental.lat IS NOT NULL
ORDER BY r."createdAt" DESC
LIMIT 20; 