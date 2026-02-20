import apiClient, { type APIPaginationSuccessResponse } from './config'

interface User {
    id: string;
    username: string;
    fullName: string;
    email: {
      email: string;
      isVerify: boolean;
    }
    phoneNumber: {
        phoneNumber: string;
        isVerify: boolean;
    }
    gender: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth: string | null;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
  }

interface GetUsersParams {
    page: number;
    pageSize: number;
    orderBy: "ASC" | "DESC";
    sortBy: "username" | "email" | "phoneNumber" | "fullName" | "isActived" | "createdAt";
}

const userApi = {
  getUsers(params: GetUsersParams): Promise<APIPaginationSuccessResponse<User[]>> {
    return apiClient.get(
      `/accounts?page=${params.page}&pageSize=${params.pageSize}&orderBy=${params.orderBy}&sortBy=${params.sortBy}`
    )
  },
}

export default userApi
export type { User, GetUsersParams }