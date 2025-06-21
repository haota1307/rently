-- Recommendation Performance Optimization Indexes
-- Created: 2025-01-27
-- Purpose: Tối ưu hiệu suất cho hệ thống gợi ý phòng trọ

-- 1. Composite index cho Room - tối ưu candidate rooms query
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_room_available_price_area" 
ON "Room" ("isAvailable", "price", "area") 
WHERE "isAvailable" = true;

-- 2. Spatial index cho Rental - tối ưu location-based recommendations  
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_rental_location" 
ON "Rental" ("lat", "lng") 
WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL;

-- 3. Composite index cho RentalPost - tối ưu active posts query
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_rentalpost_active_status" 
ON "RentalPost" ("status", "endDate", "roomId") 
WHERE "status" = 'ACTIVE';

-- 4. Covering index cho Room details - giảm I/O
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_room_details_covering" 
ON "Room" ("id") 
INCLUDE ("title", "price", "area", "isAvailable", "rentalId", "createdAt");

-- 5. Collaborative filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_favorite_user_time" 
ON "Favorite" ("userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_viewing_tenant_time" 
ON "ViewingSchedule" ("tenantId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_request_tenant_time" 
ON "RentalRequest" ("tenantId", "createdAt" DESC);

-- 6. Room amenities optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_room_amenity_room" 
ON "RoomAmenity" ("roomId", "amenityId");

-- 7. Rental images optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_rental_image_order" 
ON "RentalImage" ("rentalId", "order" ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_room_image_order" 
ON "RoomImage" ("roomId", "order" ASC);

-- 8. User role optimization cho collaborative filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_role_status" 
ON "User" ("roleId", "status") 
WHERE "status" = 'ACTIVE';

-- 9. Popularity calculation optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_rentalpost_popularity" 
ON "RentalPost" ("roomId", "status", "createdAt" DESC) 
WHERE "status" = 'ACTIVE';

-- 10. Distance calculation optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_rental_distance" 
ON "Rental" ("distance") 
WHERE "distance" IS NOT NULL;

-- Statistics update để optimizer sử dụng indexes hiệu quả
ANALYZE "Room";
ANALYZE "Rental"; 
ANALYZE "RentalPost";
ANALYZE "Favorite";
ANALYZE "ViewingSchedule";
ANALYZE "RentalRequest";
ANALYZE "RoomAmenity";
ANALYZE "RentalImage";
ANALYZE "RoomImage";
ANALYZE "User"; 