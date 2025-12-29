export interface ApiQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  filters?: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  >;
}

export const DEFAULT_API_QUERY: Required<
  Pick<ApiQueryParams, 'page' | 'limit'>
> = {
  page: 1,
  limit: 10,
};
