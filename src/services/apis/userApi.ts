import apiClient, { type APIPaginationSuccessResponse, type APISuccessResponse } from './config'
import type { UserMember } from '../entities/User'

interface GetUsersParams {
  page: number
  pageSize: number
  orderBy: 'ASC' | 'DESC'
  sortBy: string
  search?: string
}

const userApi = {
  getUsers(params: GetUsersParams): Promise<APIPaginationSuccessResponse<UserMember[]>> {
    const search = params.search?.trim()
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
    return apiClient.get(
      `/users?page=${params.page}&size=${params.pageSize}&orderBy=${params.orderBy}&sortBy=${params.sortBy}${searchParam}`
    )
  },

  lockUser(id: string): Promise<APISuccessResponse<null>> {
    return apiClient.put(`/users/${id}/lock`)
  },

  unlockUser(id: string): Promise<APISuccessResponse<null>> {
    return apiClient.put(`/users/${id}/unlock`)
  },

  resetPassword(id: string): Promise<APISuccessResponse<null>> {
    return apiClient.post(`/users/${id}/reset-password`)
  },
}

export default userApi
export type { GetUsersParams }
