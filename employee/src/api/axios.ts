import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getStoredTokens, setStoredTokens, clearStoredTokens } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = getStoredTokens();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      return Promise.reject(new Error("Network Error: Backend service is unreachable. Please check your connection."));
    }

    if (error.response.status === 401 && originalRequest && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
        clearStoredTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        isRefreshing = false;
        clearStoredTokens();
        window.dispatchEvent(new CustomEvent("strivenest:employee_unauthorized"));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const resData = response.data?.data;
        if (resData?.access_token && resData?.refresh_token) {
          setStoredTokens(
            resData.access_token,
            resData.refresh_token,
            localStorage.getItem("strivenest_employee_remember_me") === "true"
          );

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${resData.access_token}`;
          }

          processQueue(null, resData.access_token);
          isRefreshing = false;

          return api(originalRequest);
        } else {
          throw new Error("Invalid token refresh response");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        clearStoredTokens();
        window.dispatchEvent(new CustomEvent("strivenest:employee_unauthorized"));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
