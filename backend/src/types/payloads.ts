export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  type: 'refresh';
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'RECEIVE'
  | 'CANCEL'
  | 'CONFIRM'
  | 'SHIP'
  | 'DELIVER'
  | 'PAY'
  | 'LOGIN'
  | 'LOGOUT';

export const HTTP_METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};
