import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { GetRecommendationsQueryType } from './recommendation.model'

@Injectable()
export class RecommendationOptimizedRepo {
  private readonly logger = new Logger(RecommendationOptimizedRepo.name)

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 🚀 Optimized candidate rooms query using raw SQL với composite indexes
   */
  async getCandidateRoomsOptimized(
    excludeRoomId: number,
    query: GetRecommendationsQueryType,
    userId?: number
  ): Promise<any[]> {
    try {
      const limit = query.limit * 5 // Over-fetch for better filtering

      if (userId) {
        // Query với user exclusions - sử dụng raw SQL để tận dụng indexes
        return await this.prismaService.$queryRaw`
          WITH candidate_rooms AS (
            SELECT DISTINCT
              r.id,
              r.title,
              r.price,
              r."isAvailable",
              r.area,
              r."rentalId",
              r."createdAt",
              rental.title as rental_title,
              rental.address,
              rental.lat,
              rental.lng,
              rental.distance,
              COUNT(rp.id) as active_posts_count
            FROM "Room" r
            INNER JOIN "Rental" rental ON r."rentalId" = rental.id
            INNER JOIN "RentalPost" rp ON r.id = rp."roomId" 
            WHERE r.id != ${excludeRoomId}
              AND r."isAvailable" = true
              AND rp.status = 'ACTIVE'
              AND rp."endDate" >= NOW()
              -- Exclude user interactions
              AND NOT EXISTS (
                SELECT 1 FROM "Favorite" f 
                WHERE f."rentalId" = rental.id AND f."userId" = ${userId}
              )
              AND NOT EXISTS (
                SELECT 1 FROM "RentalRequest" rr
                INNER JOIN "RentalPost" rp2 ON rr."postId" = rp2.id
                WHERE rp2."roomId" = r.id AND rr."tenantId" = ${userId}
              )
              AND NOT EXISTS (
                SELECT 1 FROM "ViewingSchedule" vs
                INNER JOIN "RentalPost" rp3 ON vs."postId" = rp3.id
                WHERE rp3."roomId" = r.id AND vs."tenantId" = ${userId}
              )
            GROUP BY r.id, rental.id
            ORDER BY active_posts_count DESC, r."createdAt" DESC
            LIMIT ${limit}
          )
          SELECT 
            cr.*,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', ri.id,
                  'imageUrl', ri."imageUrl",
                  'order', ri."order"
                )
                ORDER BY ri."order"
              ) FILTER (WHERE ri.id IS NOT NULL),
              '[]'::json
            ) as rental_images,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', rim.id,
                  'imageUrl', rim."imageUrl", 
                  'order', rim."order"
                )
                ORDER BY rim."order"
              ) FILTER (WHERE rim.id IS NOT NULL),
              '[]'::json  
            ) as room_images,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'amenityId', ra."amenityId",
                  'amenity', jsonb_build_object(
                    'id', a.id,
                    'name', a.name
                  )
                )
              ) FILTER (WHERE ra.id IS NOT NULL),
              '[]'::json
            ) as room_amenities
          FROM candidate_rooms cr
          LEFT JOIN "RentalImage" ri ON ri."rentalId" = cr."rentalId" AND ri."order" <= 3
          LEFT JOIN "RoomImage" rim ON rim."roomId" = cr.id AND rim."order" <= 3
          LEFT JOIN "RoomAmenity" ra ON ra."roomId" = cr.id
          LEFT JOIN "Amenity" a ON a.id = ra."amenityId"
          GROUP BY cr.id, cr.title, cr.price, cr."isAvailable", cr.area, 
                   cr."rentalId", cr."createdAt", cr.rental_title, 
                   cr.address, cr.lat, cr.lng, cr.distance, cr.active_posts_count
          ORDER BY cr.active_posts_count DESC, cr."createdAt" DESC
        `
      } else {
        // Simplified query for anonymous users
        return await this.prismaService.$queryRaw`
          WITH candidate_rooms AS (
            SELECT DISTINCT
              r.id,
              r.title,
              r.price,
              r."isAvailable",
              r.area,
              r."rentalId",
              r."createdAt",
              rental.title as rental_title,
              rental.address,
              rental.lat,
              rental.lng,
              rental.distance
            FROM "Room" r
            INNER JOIN "Rental" rental ON r."rentalId" = rental.id
            INNER JOIN "RentalPost" rp ON r.id = rp."roomId"
            WHERE r.id != ${excludeRoomId}
              AND r."isAvailable" = true
              AND rp.status = 'ACTIVE'
              AND rp."endDate" >= NOW()
            ORDER BY r."createdAt" DESC
            LIMIT ${limit}
          )
          SELECT 
            cr.*,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', ri.id,
                  'imageUrl', ri."imageUrl",
                  'order', ri."order"
                )
                ORDER BY ri."order"
              ) FILTER (WHERE ri.id IS NOT NULL),
              '[]'::json
            ) as rental_images,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', rim.id,
                  'imageUrl', rim."imageUrl",
                  'order', rim."order"
                )
                ORDER BY rim."order"
              ) FILTER (WHERE rim.id IS NOT NULL),
              '[]'::json
            ) as room_images,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'amenityId', ra."amenityId",
                  'amenity', jsonb_build_object(
                    'id', a.id,
                    'name', a.name
                  )
                )
              ) FILTER (WHERE ra.id IS NOT NULL),
              '[]'::json
            ) as room_amenities
          FROM candidate_rooms cr
          LEFT JOIN "RentalImage" ri ON ri."rentalId" = cr."rentalId" AND ri."order" <= 3
          LEFT JOIN "RoomImage" rim ON rim."roomId" = cr.id AND rim."order" <= 3
          LEFT JOIN "RoomAmenity" ra ON ra."roomId" = cr.id
          LEFT JOIN "Amenity" a ON a.id = ra."amenityId"
          GROUP BY cr.id, cr.title, cr.price, cr."isAvailable", cr.area,
                   cr."rentalId", cr."createdAt", cr.rental_title, 
                   cr.address, cr.lat, cr.lng, cr.distance
          ORDER BY cr."createdAt" DESC
        `
      }
    } catch (error) {
      this.logger.error('Error in optimized candidate rooms query:', error)
      throw error
    }
  }

  /**
   * 🚀 Optimized popular rooms query với aggregated metrics
   */
  async getPopularRoomsOptimized(
    excludeRoomId: number,
    limit: number = 10
  ): Promise<any[]> {
    try {
      return await this.prismaService.$queryRaw`
        WITH room_popularity AS (
          SELECT 
            r.id,
            r.title,
            r.price,
            r.area,
            r."isAvailable",
            r."rentalId",
            r."createdAt",
            rental.title as rental_title,
            rental.address,
            rental.lat,
            rental.lng,
            -- Calculate popularity score
            (
              COALESCE(fav_count.count, 0) * 1 +
              COALESCE(view_count.count, 0) * 2 +  
              COALESCE(req_count.count, 0) * 3
            ) as popularity_score
          FROM "Room" r
          INNER JOIN "Rental" rental ON r."rentalId" = rental.id
          INNER JOIN "RentalPost" rp ON r.id = rp."roomId"
          -- Favorites count
          LEFT JOIN (
            SELECT rental."id" as rental_id, COUNT(*) as count
            FROM "Favorite" f
            INNER JOIN "Rental" rental ON f."rentalId" = rental.id
            WHERE f."createdAt" >= NOW() - INTERVAL '6 months'
            GROUP BY rental.id
          ) fav_count ON fav_count.rental_id = rental.id
          -- Viewing schedules count  
          LEFT JOIN (
            SELECT rp."roomId", COUNT(*) as count
            FROM "ViewingSchedule" vs
            INNER JOIN "RentalPost" rp ON vs."postId" = rp.id
            WHERE vs."createdAt" >= NOW() - INTERVAL '3 months'
            GROUP BY rp."roomId"
          ) view_count ON view_count."roomId" = r.id
          -- Rental requests count
          LEFT JOIN (
            SELECT rp."roomId", COUNT(*) as count
            FROM "RentalRequest" rr
            INNER JOIN "RentalPost" rp ON rr."postId" = rp.id  
            WHERE rr."createdAt" >= NOW() - INTERVAL '3 months'
            GROUP BY rp."roomId"
          ) req_count ON req_count."roomId" = r.id
          WHERE r.id != ${excludeRoomId}
            AND r."isAvailable" = true
            AND rp.status = 'ACTIVE'
            AND rp."endDate" >= NOW()
          GROUP BY r.id, rental.id, fav_count.count, view_count.count, req_count.count
          HAVING (
            COALESCE(fav_count.count, 0) +
            COALESCE(view_count.count, 0) + 
            COALESCE(req_count.count, 0)
          ) > 0
          ORDER BY popularity_score DESC, r."createdAt" DESC
          LIMIT ${limit}
        )
        SELECT 
          rp.*,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', ri.id,
                'imageUrl', ri."imageUrl",
                'order', ri."order"
              )
              ORDER BY ri."order"
            ) FILTER (WHERE ri.id IS NOT NULL),
            '[]'::json
          ) as rental_images,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'amenityId', ra."amenityId",
                'amenity', jsonb_build_object(
                  'id', a.id,
                  'name', a.name
                )
              )
            ) FILTER (WHERE ra.id IS NOT NULL),
            '[]'::json
          ) as room_amenities
        FROM room_popularity rp
        LEFT JOIN "RentalImage" ri ON ri."rentalId" = rp."rentalId" AND ri."order" <= 3
        LEFT JOIN "RoomAmenity" ra ON ra."roomId" = rp.id
        LEFT JOIN "Amenity" a ON a.id = ra."amenityId"
        GROUP BY rp.id, rp.title, rp.price, rp.area, rp."isAvailable", 
                 rp."rentalId", rp."createdAt", rp.rental_title, 
                 rp.address, rp.lat, rp.lng, rp.popularity_score
        ORDER BY rp.popularity_score DESC, rp."createdAt" DESC
      `
    } catch (error) {
      this.logger.error('Error in optimized popular rooms query:', error)
      throw error
    }
  }

  /**
   * 🚀 Optimized user interactions query cho collaborative filtering
   */
  async getUserInteractionsOptimized(userId: number): Promise<any> {
    try {
      return await this.prismaService.$queryRaw`
        WITH user_favorites AS (
          SELECT 
            f."rentalId",
            f."createdAt",
            'favorite' as interaction_type,
            2.0 as weight,
            r.id as room_id,
            r.price,
            r.area,
            rental.lat,
            rental.lng,
            json_agg(
              DISTINCT jsonb_build_object(
                'amenityId', ra."amenityId",
                'name', a.name
              )
            ) as amenities
          FROM "Favorite" f
          INNER JOIN "Rental" rental ON f."rentalId" = rental.id
          INNER JOIN "Room" r ON r."rentalId" = rental.id
          LEFT JOIN "RoomAmenity" ra ON ra."roomId" = r.id
          LEFT JOIN "Amenity" a ON a.id = ra."amenityId"
          WHERE f."userId" = ${userId}
            AND f."createdAt" >= NOW() - INTERVAL '6 months'
            AND r."isAvailable" = true
          GROUP BY f."rentalId", f."createdAt", r.id, r.price, r.area, rental.lat, rental.lng
        ),
        user_requests AS (
          SELECT 
            rp."roomId" as room_id,
            rr."createdAt",
            'request' as interaction_type,
            3.0 as weight,
            r.price,
            r.area,
            rental.lat,
            rental.lng,
            json_agg(
              DISTINCT jsonb_build_object(
                'amenityId', ra."amenityId", 
                'name', a.name
              )
            ) as amenities
          FROM "RentalRequest" rr
          INNER JOIN "RentalPost" rp ON rr."postId" = rp.id
          INNER JOIN "Room" r ON r.id = rp."roomId"
          INNER JOIN "Rental" rental ON r."rentalId" = rental.id
          LEFT JOIN "RoomAmenity" ra ON ra."roomId" = r.id
          LEFT JOIN "Amenity" a ON a.id = ra."amenityId"
          WHERE rr."tenantId" = ${userId}
            AND rr."createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY rp."roomId", rr."createdAt", r.price, r.area, rental.lat, rental.lng
        ),
        user_viewings AS (
          SELECT 
            rp."roomId" as room_id,
            vs."createdAt",
            'viewing' as interaction_type,
            1.5 as weight,
            r.price,
            r.area,
            rental.lat,
            rental.lng,
            json_agg(
              DISTINCT jsonb_build_object(
                'amenityId', ra."amenityId",
                'name', a.name
              )
            ) as amenities
          FROM "ViewingSchedule" vs
          INNER JOIN "RentalPost" rp ON vs."postId" = rp.id
          INNER JOIN "Room" r ON r.id = rp."roomId"
          INNER JOIN "Rental" rental ON r."rentalId" = rental.id
          LEFT JOIN "RoomAmenity" ra ON ra."roomId" = r.id
          LEFT JOIN "Amenity" a ON a.id = ra."amenityId"
          WHERE vs."tenantId" = ${userId}
            AND vs."createdAt" >= NOW() - INTERVAL '3 months'
          GROUP BY rp."roomId", vs."createdAt", r.price, r.area, rental.lat, rental.lng
        )
        SELECT 
          room_id,
          interaction_type,
          weight,
          price,
          area,
          lat,
          lng,
          amenities,
          "createdAt"
        FROM (
          SELECT room_id, interaction_type, weight, price, area, lat, lng, amenities, "createdAt" FROM user_favorites
          UNION ALL
          SELECT room_id, interaction_type, weight, price, area, lat, lng, amenities, "createdAt" FROM user_requests  
          UNION ALL
          SELECT room_id, interaction_type, weight, price, area, lat, lng, amenities, "createdAt" FROM user_viewings
        ) combined_interactions
        ORDER BY weight DESC, "createdAt" DESC
      `
    } catch (error) {
      this.logger.error('Error in optimized user interactions query:', error)
      throw error
    }
  }

  /**
   * 🚀 Batch similarity calculation using window functions
   */
  async calculateBatchSimilarity(
    targetRoomId: number,
    candidateRoomIds: number[]
  ): Promise<
    Array<{ roomId: number; locationScore: number; priceScore: number }>
  > {
    try {
      if (candidateRoomIds.length === 0) return []

      return await this.prismaService.$queryRaw`
        WITH target_room AS (
          SELECT r.price, r.area, rental.lat, rental.lng
          FROM "Room" r
          INNER JOIN "Rental" rental ON r."rentalId" = rental.id
          WHERE r.id = ${targetRoomId}
        ),
        candidate_rooms AS (
          SELECT 
            r.id,
            r.price,
            r.area,
            rental.lat,
            rental.lng
          FROM "Room" r
          INNER JOIN "Rental" rental ON r."rentalId" = rental.id
          WHERE r.id = ANY(${candidateRoomIds})
        )
        SELECT 
          cr.id as "roomId",
          -- Location similarity using Haversine formula approximation
          CASE 
            WHEN (
              6371000 * acos(
                cos(radians(tr.lat::float)) * 
                cos(radians(cr.lat::float)) * 
                cos(radians(cr.lng::float) - radians(tr.lng::float)) + 
                sin(radians(tr.lat::float)) * 
                sin(radians(cr.lat::float))
              )
            ) <= 500 THEN 1.0
            WHEN (
              6371000 * acos(
                cos(radians(tr.lat::float)) * 
                cos(radians(cr.lat::float)) * 
                cos(radians(cr.lng::float) - radians(tr.lng::float)) + 
                sin(radians(tr.lat::float)) * 
                sin(radians(cr.lat::float))
              )
            ) >= 5000 THEN 0.0
            ELSE (
              1.0 - (
                (6371000 * acos(
                  cos(radians(tr.lat::float)) * 
                  cos(radians(cr.lat::float)) * 
                  cos(radians(cr.lng::float) - radians(tr.lng::float)) + 
                  sin(radians(tr.lat::float)) * 
                  sin(radians(cr.lat::float))
                ) - 500) / 4500
              )
            )
          END as "locationScore",
          -- Price similarity
          CASE
            WHEN ABS(tr.price::float - cr.price::float) / ((tr.price::float + cr.price::float) / 2) <= 0.15 THEN 1.0
            WHEN ABS(tr.price::float - cr.price::float) / ((tr.price::float + cr.price::float) / 2) >= 0.3 THEN 0.0
            ELSE (
              1.0 - (
                (ABS(tr.price::float - cr.price::float) / ((tr.price::float + cr.price::float) / 2) - 0.15) / 0.15
              )
            )
          END as "priceScore"
        FROM candidate_rooms cr
        CROSS JOIN target_room tr
      `
    } catch (error) {
      this.logger.error('Error in batch similarity calculation:', error)
      throw error
    }
  }
}
