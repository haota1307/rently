// API URL
export const API_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Authentication
export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USER_KEY = "user";
