import apiClient, { type APIPaginationSuccessResponse, type APIResponse } from './config'
import type { UserMember } from '../entities/User'

interface GetUsersParams {
    page: number;
    pageSize: number;
    orderBy: "ASC" | "DESC";
    sortBy: "username" | "email" | "phoneNumber" | "fullName" | "isActived" | "createdAt";
    search?: string;
}

const userApi = {

  getUsers(params: GetUsersParams): Promise<APIPaginationSuccessResponse<UserMember[]>> {
    const search = params.search?.trim()
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
    return apiClient.get(
      `/accounts?page=${params.page}&pageSize=${params.pageSize}&orderBy=${params.orderBy}&sortBy=${params.sortBy}${searchParam}`
    )
  },

  resetPassword(id: string): Promise<APIResponse> {
    return apiClient.post(`/accounts/${id}/reset-password`);
  },

  lockUser(id: string): Promise<APIResponse> {
    return apiClient.post(`/accounts/${id}/lock`);
  },

  unlockUser(id: string): Promise<APIResponse> {
    return apiClient.post(`/accounts/${id}/unlock`);
  },
}

export default userApi
export type { UserMember, GetUsersParams }