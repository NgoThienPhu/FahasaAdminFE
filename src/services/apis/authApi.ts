import apiClient, { type APIResponse, type APISuccessResponse } from "./Config";
import type { UserAdmin } from "../entities/User";

interface LoginParams {
    username: string;
    password: string;
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

    getProfile(): Promise<APISuccessResponse<UserAdmin>> {
        return apiClient.get("/accounts/me");
    },

};

export default authApi;