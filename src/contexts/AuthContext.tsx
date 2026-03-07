import React, { useEffect } from "react";
import authApi from "../services/apis/authApi";
import type { UserAdmin } from "../services/entities/User";
import { useNotification } from "../contexts/NotificationContext";

interface AuthContextType {
  user: UserAdmin | null;
  isAuth: boolean;
  isLoading: boolean;
  login: (user: UserAdmin) => void;
  logout: () => void;
  reload: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotification();
  const [user, setUser] = React.useState<UserAdmin | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) reload();
  }, []);

  const login = (userData: UserAdmin) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      setUser(null);
      localStorage.removeItem("accessToken");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      const msg = (error as { message?: string; error?: string })?.message ?? (error as { message?: string; error?: string })?.error ?? "Đăng xuất thất bại.";
      addNotification("error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getProfile();
      setUser({ ...response.data });
    } catch (error) {
      console.error("Không thể lấy thông tin người dùng:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuth: !!user,
    isLoading,
    login,
    logout,
    reload
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("Để sử dụng useAuth phải nằm bên trong AuthProvider");
  return context;
};