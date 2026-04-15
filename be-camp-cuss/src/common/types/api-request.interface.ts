export interface ApiQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'name' | 'updated_at' | 'id';
  sortOrder?: 'asc' | 'desc';
  filters?: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  >;
}

export const DEFAULT_API_QUERY: Required<
  Pick<ApiQueryParams, 'page' | 'limit' | 'sortBy' | 'sortOrder'>
> = {
  page: 1,
  limit: 10,
  sortBy: 'created_at',
  sortOrder: 'desc',
};
