export interface RecommendationMethod {
  CONTENT_BASED: "CONTENT_BASED";
  POPULARITY: "POPULARITY";
  LOCATION_BASED: "LOCATION_BASED";
  COLLABORATIVE: "COLLABORATIVE";
  HYBRID: "HYBRID";
}

export interface SimilarityBreakdown {
  location: number;
  price: number;
  area: number;
  amenities: number;
  overall: number;
}

export interface RecommendationExplanation {
  reasons: string[];
  distance?: number;
  priceDifference?: number;
  areaDifference?: number;
  commonAmenities?: string[];
}

export interface RentalImage {
  id: number;
  imageUrl: string;
  order: number;
}

export interface RoomImage {
  id: number;
  imageUrl: string;
  order: number;
}

export interface Amenity {
  id: number;
  name: string;
}

export interface RoomAmenity {
  amenity: Amenity;
}

export interface Rental {
  id: number;
  title: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  rentalImages?: RentalImage[];
}

export interface RecommendedRoom {
  id: number;
  title: string;
  price: number;
  area: number;
  similarityScore: number;
  method: keyof RecommendationMethod;
  explanation: RecommendationExplanation;
  similarityBreakdown: SimilarityBreakdown;
  rank: number;
  rental: Rental;
  roomImages?: RoomImage[];
  roomAmenities?: RoomAmenity[];
}

export interface SimilarityWeights {
  location: number;
  price: number;
  area: number;
  amenities: number;
}

export interface TargetRoom {
  id: number;
  title: string;
  price: number;
  area: number;
  isAvailable: boolean;
}

export interface RecommendationMetadata {
  totalCandidates: number;
  method: keyof RecommendationMethod;
  executionTime: number;
  weights: SimilarityWeights;
  targetRoom: TargetRoom;
}

export interface RecommendationsResponse {
  data: RecommendedRoom[];
  metadata: RecommendationMetadata;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RecommendationParams {
  roomId: number;
  limit?: number;
  method?: keyof RecommendationMethod;
  maxDistance?: number;
  priceVariance?: number;
  areaVariance?: number;
}

export interface TrackClickParams {
  sourceRoomId: number;
  targetRoomId: number;
  method: keyof RecommendationMethod;
  rank: number;
  similarityScore: number;
}

export interface RecommendationError {
  message: string;
  status?: number;
  code?: string;
}
