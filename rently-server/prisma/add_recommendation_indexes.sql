-- Optimize recommendation queries with indexes
CREATE INDEX IF NOT EXISTS "Rental_lat_lng_idx" ON "Rental"("lat", "lng");
CREATE INDEX IF NOT EXISTS "Room_area_idx" ON "Room"("area");
CREATE INDEX IF NOT EXISTS "Room_isAvailable_rentalId_idx" ON "Room"("isAvailable", "rentalId");
CREATE INDEX IF NOT EXISTS "RentalPost_status_endDate_idx" ON "RentalPost"("status", "endDate");
CREATE INDEX IF NOT EXISTS "RentalPost_roomId_idx" ON "RentalPost"("roomId");
