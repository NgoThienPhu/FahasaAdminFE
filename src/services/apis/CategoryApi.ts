import apiClient, { type APIPaginationSuccessResponse, type APISuccessResponse } from './Config'
import type { Category } from '../entities/Category'

interface GetCategoriesParams {
  page: number
  pageSize: number
  orderBy: 'ASC' | 'DESC'
  sortBy: 'name' | 'createdAt'
  search?: string
}

interface CreateCategoryParams {
  categoryName: string
}

interface UpdateCategoryParams {
  categoryName: string
}

const categoryApi = {

  getCategories(params: GetCategoriesParams): Promise<APIPaginationSuccessResponse<Category[]>> {
    const search = params.search?.trim()
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
    return apiClient.get(
      `/categories?page=${params.page}&size=${params.pageSize}&orderBy=${params.orderBy}&sortBy=${params.sortBy}${searchParam}`
    )
  },

  createCategory(params: CreateCategoryParams): Promise<APISuccessResponse<Category>> {
    return apiClient.post('/categories', params)
  },

  updateCategory(id: string, params: UpdateCategoryParams): Promise<APISuccessResponse<Category>> {
    return apiClient.put(`/categories/${id}`, params)
  },

  deleteCategory(id: string): Promise<APISuccessResponse<null>> {
    return apiClient.delete(`/categories/${id}`)
  },
}

export default categoryApi
export type { GetCategoriesParams, CreateCategoryParams, UpdateCategoryParams }

