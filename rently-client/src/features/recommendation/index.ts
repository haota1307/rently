// Main component
export { RoomRecommendations } from "./components/RoomRecommendations";

// Supporting components
export {
  RecommendationSkeleton,
  RecommendationSkeletonCompact,
} from "./components/RecommendationSkeleton";
export {
  RecommendationError,
  RecommendationErrorCompact,
} from "./components/RecommendationError";

// Hooks
export {
  useRecommendations,
  useTrackRecommendationClick,
} from "./hooks/useRecommendations";

// Integration examples
export {
  RoomDetailRecommendations,
  RoomDetailRecommendationsCompact,
  RoomDetailRecommendationsAdvanced,
} from "./examples/room-detail-integration";

// Types
export type {
  RecommendationMethod,
  SimilarityBreakdown,
  RecommendationExplanation,
  RentalImage,
  RoomImage,
  Amenity,
  RoomAmenity,
  Rental,
  RecommendedRoom,
  SimilarityWeights,
  TargetRoom,
  RecommendationMetadata,
  RecommendationsResponse,
  ApiResponse,
  RecommendationParams,
  TrackClickParams,
  RecommendationError as RecommendationErrorType,
} from "@/types/recommendation";
