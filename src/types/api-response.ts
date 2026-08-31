/// Generic API response wrapper — konsisten di semua endpoint
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/// Pagination params untuk list endpoints
export interface PaginationParams {
  page?: number;
  limit?: number;
}
