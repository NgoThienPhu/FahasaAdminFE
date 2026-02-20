import axios from "axios";
import authApi from "./authApi";

const VITE_API_BE_SERVER_URL = import.meta.env.VITE_API_BE_SERVER_URL;

export const API_BE_SERVER_URL = VITE_API_BE_SERVER_URL || "http://localhost:8080/api/admin";

export interface APIResponse {
  message: string;
  status: number;
  timestamp: string;
}

export interface APISuccessResponse<T> extends APIResponse {
  data: T;
}

export interface APIPaginationSuccessResponse<T> extends APISuccessResponse<T> {
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface APIResponseError extends APIResponse {
  error: string;
  errors?: { [key: string]: string };
  path: string;
}

const apiClient = axios.create({
  baseURL: API_BE_SERVER_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res.data,

  async (error) => {
    console.log("Lỗi API:", error);
    const originalRequest = error.config;

    if (!error.response) {
      console.error("Không kết nối được server!");
      return Promise.reject({
        message: "Không thể kết nối tới server. Vui lòng kiểm tra internet hoặc thử lại.",
      });
    }

    const response = error.response;

    const isRefreshEndpoint =
      typeof originalRequest.url === 'string' && originalRequest.url.includes('/auth/refresh');

    if (response.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await authApi.refreshToken();
        const newToken =
          (refreshResponse as { data?: { accessToken?: string }; accessToken?: string }).data?.accessToken ??
          (refreshResponse as { accessToken?: string }).accessToken;

        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (e) {
        console.error("Làm mới token thất bại:", e);
      }

      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(error.response?.data ?? { message: "Phiên đăng nhập hết hạn." });
    }

    if (response.status !== 401) {
      console.error("Lỗi API:", response.data);
    }

    if (response.status === 403) {
      console.warn("Bạn không có quyền truy cập tài nguyên này");
    }

    if (response.status >= 500) {
      console.error("Lỗi server:", error.response.data);
    }

    return Promise.reject(error.response.data as APIResponseError);
  }
);

export default apiClient;