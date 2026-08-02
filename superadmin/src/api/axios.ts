import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getStoredTokens, setStoredTokens, clearStoredTokens } from "../utils/storage";

const CONFIGURED_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/v1";

const NORMALIZED_API_URL = CONFIGURED_API_URL.replace(/\/$/, "");
const API_BASE_URL = NORMALIZED_API_URL.endsWith("/api/v1")
  ? NORMALIZED_API_URL
  : NORMALIZED_API_URL.endsWith("/api")
    ? `${NORMALIZED_API_URL}/v1`
    : `${NORMALIZED_API_URL}/api/v1`;

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

// Response Interceptor for handling 401 & Automatic Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      return Promise.reject(new Error("Network Error: Backend service is unreachable. Please check your connection."));
    }

    // Handle 401 Unauthorized
    if (error.response.status === 401 && originalRequest && !originalRequest._retry) {
      // Avoid infinite refresh loop if refresh itself fails
      if (originalRequest.url?.includes("/v1/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
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
        window.dispatchEvent(new CustomEvent("strivenest:unauthorized"));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const resData = response.data?.data;
        if (resData?.access_token && resData?.refresh_token) {
          setStoredTokens(resData.access_token, resData.refresh_token, localStorage.getItem("strivenest_superadmin_remember_me") === "true");

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${resData.access_token}`;
          }

          processQueue(null, resData.access_token);
          isRefreshing = false;

          return api(originalRequest);
        } else {
          throw new Error("Invalid token refresh payload.");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        clearStoredTokens();
        window.dispatchEvent(new CustomEvent("strivenest:unauthorized"));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
