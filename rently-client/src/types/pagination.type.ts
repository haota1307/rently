export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponseType<T> {
  data: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}
