-- Migration: Favorite Rental to Post
-- Date: 2025-01-29

-- Step 1: Add postId column and indexes
ALTER TABLE "Favorite" ADD COLUMN "postId" INTEGER;
CREATE INDEX "idx_favorite_post_id" ON "Favorite" ("postId");
CREATE INDEX "idx_favorite_user_post" ON "Favorite" ("userId", "postId");

-- Step 2: Migrate data from rentalId to postId
-- For each favorite, find the active post for that rental
UPDATE "Favorite" 
SET "postId" = (
    SELECT "RentalPost"."id" 
    FROM "RentalPost" 
    WHERE "RentalPost"."rentalId" = "Favorite"."rentalId" 
    AND "RentalPost"."status" = 'ACTIVE'
    AND "RentalPost"."endDate" > NOW()
    ORDER BY "RentalPost"."createdAt" DESC
    LIMIT 1
)
WHERE "postId" IS NULL;

-- Step 3: Add foreign key constraint
ALTER TABLE "Favorite" 
ADD CONSTRAINT "fk_favorite_post" 
FOREIGN KEY ("postId") REFERENCES "RentalPost"("id") ON DELETE CASCADE;

-- Step 4: Add unique constraint for userId + postId
ALTER TABLE "Favorite" ADD CONSTRAINT "unique_user_post" UNIQUE ("userId", "postId");

-- Step 5: Drop old rentalId constraint and column
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_rentalId_fkey";
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_rentalId_key";
DROP INDEX IF EXISTS "idx_favorite_user_rental_v2";
ALTER TABLE "Favorite" DROP COLUMN "rentalId";

-- Step 6: Make postId NOT NULL
ALTER TABLE "Favorite" ALTER COLUMN "postId" SET NOT NULL; 