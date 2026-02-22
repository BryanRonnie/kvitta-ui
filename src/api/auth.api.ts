import { api } from "./axios";
import {
  UserCreate,
  UserLogin,
  TokenResponse,
  UserResponse,
} from "@/types/auth";

/* --------------------------
   Signup
-------------------------- */
export const signup = async (
  data: UserCreate
): Promise<TokenResponse> => {
  const formData = new URLSearchParams();
  formData.append("email", data.email);
  formData.append("password", data.password);
  if (data.name) {
    formData.append("name", data.name);
  }

  const res = await api.post<TokenResponse>(
    "/auth/signup",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  // persist token
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", res.data.access_token);
  }

  return res.data;
};

/* --------------------------
   Login
-------------------------- */
export const login = async (
  data: UserLogin
): Promise<TokenResponse> => {
  const formData = new URLSearchParams();
  formData.append("email", data.email);
  formData.append("password", data.password);

  const res = await api.post<TokenResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", res.data.access_token);
  }

  return res.data;
};

/* --------------------------
   Logout
-------------------------- */
export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");

  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
};

/* --------------------------
   Get current user
-------------------------- */
export const getCurrentUser = async (): Promise<UserResponse> => {
  const res = await api.get<UserResponse>("/auth/me");
  return res.data;
};

/* --------------------------
   Refresh token
-------------------------- */
export const refreshToken = async (): Promise<TokenResponse> => {
  const res = await api.post<TokenResponse>("/auth/refresh");

  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", res.data.access_token);
  }

  return res.data;
};