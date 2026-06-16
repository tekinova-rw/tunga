// src/api/axios.ts

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/store/auth-store';

/**
 * DEVELOPMENT API URL
 *
 * Expo Go + Phone:
 * http://10.7.33.244:5000/api
 *
 * Android Emulator:
 * http://10.0.2.2:5000/api
 *
 * Production:
 * https://api.yourdomain.com/api
 */
const API_URL = 'http://10.7.33.242:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attach JWT token
 */
api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig
  ) => {
    const token =
      useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) =>
    Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Auto logout on invalid token
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<any>) => {
    const status =
      error.response?.status;

    if (status === 401) {
      console.log(
        '🔐 Session expired. Logging out...'
      );

      try {
        await useAuthStore
          .getState()
          .logout();
      } catch (logoutError) {
        console.log(
          'Logout Error:',
          logoutError
        );
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Optional helpers
 */
export const setAuthHeader = (
  token: string
) => {
  api.defaults.headers.common[
    'Authorization'
  ] = `Bearer ${token}`;
};

export const clearAuthHeader = () => {
  delete api.defaults.headers.common[
    'Authorization'
  ];
};

export default api;