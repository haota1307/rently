-- Geographic Bounding Box Optimization Indexes
-- Composite index cho lat/lng filtering (MAJOR performance boost)
CREATE INDEX IF NOT EXISTS "idx_rental_lat_lng_composite" 
ON "Rental" ("lat", "lng");

-- Separate indexes cho từng chiều nếu composite không hiệu quả trong một số trường hợp
CREATE INDEX IF NOT EXISTS "idx_rental_lat" 
ON "Rental" ("lat");

CREATE INDEX IF NOT EXISTS "idx_rental_lng" 
ON "Rental" ("lng");

-- Room filtering optimization indexes
CREATE INDEX IF NOT EXISTS "idx_room_available_price_area" 
ON "Room" ("isAvailable", "price", "area") 
WHERE "isAvailable" = true;

-- Price range filtering
CREATE INDEX IF NOT EXISTS "idx_room_price_available" 
ON "Room" ("price", "isAvailable") 
WHERE "isAvailable" = true;

-- Area range filtering  
CREATE INDEX IF NOT EXISTS "idx_room_area_available" 
ON "Room" ("area", "isAvailable") 
WHERE "isAvailable" = true;

-- Rental post status filtering
CREATE INDEX IF NOT EXISTS "idx_rental_post_status_end_date" 
ON "RentalPost" ("status", "endDate") 
WHERE "status" = 'ACTIVE';

-- User interaction filtering để loại trừ phòng đã tương tác
CREATE INDEX IF NOT EXISTS "idx_favorite_user_rental" 
ON "Favorite" ("userId", "rentalId");

CREATE INDEX IF NOT EXISTS "idx_rental_request_tenant" 
ON "RentalRequest" ("tenantId");

CREATE INDEX IF NOT EXISTS "idx_viewing_schedule_tenant" 
ON "ViewingSchedule" ("tenantId");

-- Room images optimization (để limit images efficiently)
CREATE INDEX IF NOT EXISTS "idx_room_images_room_order" 
ON "RoomImage" ("roomId", "order");

CREATE INDEX IF NOT EXISTS "idx_rental_images_rental_order" 
ON "RentalImage" ("rentalId", "order");

-- Combined optimization index cho main query
CREATE INDEX IF NOT EXISTS "idx_room_optimization_composite" 
ON "Room" ("isAvailable", "price", "area", "id") 
WHERE "isAvailable" = true;

-- Update table statistics để PostgreSQL optimizer sử dụng indexes hiệu quả
ANALYZE "Room";
ANALYZE "Rental";
ANALYZE "RentalPost";
ANALYZE "Favorite";
ANALYZE "RentalRequest";
ANALYZE "ViewingSchedule"; 