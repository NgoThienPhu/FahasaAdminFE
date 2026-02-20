import apiClient, { type APIResponse, type APISuccessResponse } from "./config";

interface LoginParams {
    username: string;
    password: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: {
    email: string;
    isVerify: boolean;
  }
}

interface LoginResponse { accessToken: string; }

interface RefreshTokenResponse extends LoginResponse {}

const authApi = {

    login(params: LoginParams): Promise<APISuccessResponse<LoginResponse>> {
        return apiClient.post("/auth/login", params, { withCredentials: true });
    },

    logout(): Promise<APISuccessResponse<APIResponse>> {
        return apiClient.post("/auth/logout", null, { withCredentials: true });
    },

    refreshToken(): Promise<APISuccessResponse<RefreshTokenResponse>> {
        return apiClient.post("/auth/refresh", null, { withCredentials: true });
    },

    getProfile(): Promise<APISuccessResponse<User>> {
        return apiClient.get("/accounts/me");
    },

};

export default authApi;