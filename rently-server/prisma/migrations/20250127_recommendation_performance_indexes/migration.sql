-- Room filtering optimization indexes
CREATE INDEX IF NOT EXISTS "idx_room_available_price_area_v2" 
ON "Room" ("isAvailable", "price", "area") 
WHERE "isAvailable" = true;

-- Price range filtering
CREATE INDEX IF NOT EXISTS "idx_room_price_available_v2" 
ON "Room" ("price", "isAvailable") 
WHERE "isAvailable" = true;

-- Area range filtering  
CREATE INDEX IF NOT EXISTS "idx_room_area_available_v2" 
ON "Room" ("area", "isAvailable") 
WHERE "isAvailable" = true;

-- Rental post status filtering
CREATE INDEX IF NOT EXISTS "idx_rental_post_status_end_date_v2" 
ON "RentalPost" ("status", "endDate") 
WHERE "status" = 'ACTIVE';

-- User interaction filtering để loại trừ phòng đã tương tác
CREATE INDEX IF NOT EXISTS "idx_favorite_user_rental_v2" 
ON "Favorite" ("userId", "rentalId");

CREATE INDEX IF NOT EXISTS "idx_rental_request_tenant_v2" 
ON "RentalRequest" ("tenantId");

CREATE INDEX IF NOT EXISTS "idx_viewing_schedule_tenant_v2" 
ON "ViewingSchedule" ("tenantId");

-- Room images optimization (để limit images efficiently)
CREATE INDEX IF NOT EXISTS "idx_room_images_room_order_v2" 
ON "RoomImage" ("roomId", "order");

CREATE INDEX IF NOT EXISTS "idx_rental_images_rental_order_v2" 
ON "RentalImage" ("rentalId", "order");

-- Room amenities optimization
CREATE INDEX IF NOT EXISTS "idx_room_amenity_room_v2" 
ON "RoomAmenity" ("roomId", "amenityId");

-- Combined optimization index cho main query
CREATE INDEX IF NOT EXISTS "idx_room_optimization_composite_v2" 
ON "Room" ("isAvailable", "price", "area", "id") 
WHERE "isAvailable" = true;

-- Collaborative filtering indexes
CREATE INDEX IF NOT EXISTS "idx_favorite_user_time_v2" 
ON "Favorite" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_viewing_tenant_time_v2" 
ON "ViewingSchedule" ("tenantId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_request_tenant_time_v2" 
ON "RentalRequest" ("tenantId", "createdAt" DESC);

-- Statistics update để optimizer sử dụng indexes hiệu quả
ANALYZE "Room";
ANALYZE "Rental";
ANALYZE "RentalPost";
ANALYZE "Favorite";
ANALYZE "RentalRequest";
ANALYZE "ViewingSchedule"; 