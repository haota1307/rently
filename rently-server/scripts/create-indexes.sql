-- Recommendation Performance Indexes - Development Version
-- Safe to run multiple times with IF NOT EXISTS

-- 1. Composite index cho Room
CREATE INDEX IF NOT EXISTS "idx_room_available_price_area" 
ON "Room" ("isAvailable", "price", "area") 
WHERE "isAvailable" = true;

-- 2. Spatial index cho Rental
CREATE INDEX IF NOT EXISTS "idx_rental_location" 
ON "Rental" ("lat", "lng") 
WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL;

-- 3. Composite index cho RentalPost
CREATE INDEX IF NOT EXISTS "idx_rentalpost_active_status" 
ON "RentalPost" ("status", "endDate", "roomId") 
WHERE "status" = 'ACTIVE';

-- 4. Covering index cho Room details
CREATE INDEX IF NOT EXISTS "idx_room_details_covering" 
ON "Room" ("id") 
INCLUDE ("title", "price", "area", "isAvailable", "rentalId", "createdAt");

-- 5. Collaborative filtering indexes
CREATE INDEX IF NOT EXISTS "idx_favorite_user_time" 
ON "Favorite" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_viewing_tenant_time" 
ON "ViewingSchedule" ("tenantId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_request_tenant_time" 
ON "RentalRequest" ("tenantId", "createdAt" DESC);

-- 6. Room amenities optimization
CREATE INDEX IF NOT EXISTS "idx_room_amenity_room" 
ON "RoomAmenity" ("roomId", "amenityId");

-- 7. Rental images optimization  
CREATE INDEX IF NOT EXISTS "idx_rental_image_order" 
ON "RentalImage" ("rentalId", "order" ASC);

CREATE INDEX IF NOT EXISTS "idx_room_image_order" 
ON "RoomImage" ("roomId", "order" ASC);

-- 8. User role optimization
CREATE INDEX IF NOT EXISTS "idx_user_role_status" 
ON "User" ("roleId", "status") 
WHERE "status" = 'ACTIVE';

-- 9. Popularity calculation optimization
CREATE INDEX IF NOT EXISTS "idx_rentalpost_popularity" 
ON "RentalPost" ("roomId", "status", "createdAt" DESC) 
WHERE "status" = 'ACTIVE';

-- 10. Distance calculation optimization
CREATE INDEX IF NOT EXISTS "idx_rental_distance" 
ON "Rental" ("distance") 
WHERE "distance" IS NOT NULL;

-- 11. RentalPost roomId optimization
CREATE INDEX IF NOT EXISTS "idx_rentalpost_roomid_status" 
ON "RentalPost" ("roomId", "status") 
WHERE "status" = 'ACTIVE';

-- Update statistics
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