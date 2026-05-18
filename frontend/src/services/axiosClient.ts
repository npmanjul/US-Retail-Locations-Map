import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
          },
        );

        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed");

        // Optional redirect
        // window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const apiClient = {
  get: async <T>(
    url: string,
    params = {},
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await api.get<T>(url, {
      params,
      ...config,
    });

    return response.data;
  },

  post: async <T>(
    url: string,
    data = {},
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await api.post<T>(url, data, config);

    return response.data;
  },

  put: async <T>(
    url: string,
    data = {},
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await api.put<T>(url, data, config);

    return response.data;
  },

  patch: async <T>(
    url: string,
    data = {},
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await api.patch<T>(url, data, config);

    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<T>(url, config);

    return response.data;
  },
};

export default api;
