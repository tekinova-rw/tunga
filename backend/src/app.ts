// src/services/api.ts
import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Error response type from backend
interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

// API Configuration
const getBaseURL = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    if (Platform.OS === 'ios') {
      return 'http://localhost:5000/api';
    }
    // ✅ Updated to your current IP
    return 'http://10.7.33.242:5000/api';
  }
  return 'https://api.vetconnect.rw/api';
};

// Storage keys
const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';
const USER_KEY = '@user_data';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request tracking for pending requests
let pendingRequests: Map<string, AbortController> = new Map();
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const cancelPendingRequest = (url: string) => {
  const controller = pendingRequests.get(url);
  if (controller) {
    controller.abort();
    pendingRequests.delete(url);
  }
};

// Token management
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving refresh token:', error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    delete api.defaults.headers.common['Authorization'];
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestKey = `${config.method}:${config.url}`;
    cancelPendingRequest(requestKey);
    
    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.set(requestKey, controller);
    
    const token = await getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['X-Request-Time'] = Date.now().toString();
    
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const requestKey = `${response.config.method}:${response.config.url}`;
    pendingRequests.delete(requestKey);
    
    console.log(`📥 API Response: ${response.status} ${response.config.url}`);
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestKey = `${originalRequest.method}:${originalRequest.url}`;
    pendingRequests.delete(requestKey);
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - check your connection');
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        status: 0,
      } as ApiError);
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      return Promise.reject({
        message: 'Request timeout. Please try again.',
        status: 408,
      } as ApiError);
    }
    
    // Get error data from response
    const errorData = error.response?.data as ErrorResponse | undefined;
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await getRefreshToken();
        
        if (!refreshToken) {
          await clearTokens();
          return Promise.reject(error);
        }
        
        if (!isRefreshing) {
          isRefreshing = true;
          
          try {
            const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
              refreshToken,
            });
            
            const { token } = response.data;
            await setAuthToken(token);
            
            isRefreshing = false;
            processQueue(null, token);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
            
          } catch (refreshError) {
            isRefreshing = false;
            processQueue(refreshError as Error, null);
            await clearTokens();
            return Promise.reject(refreshError);
          }
        }
        
        // Queue requests while refreshing token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
          
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    // Format error message
    const apiError: ApiError = {
      message: errorData?.message || error.message || 'An error occurred',
      status: error.response?.status,
      errors: errorData?.errors,
    };
    
    console.error(`❌ API Error: ${apiError.status} - ${apiError.message}`);
    
    return Promise.reject(apiError);
  }
);

// Helper methods for API calls
export const apiService = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<T>(url, config);
    return response.data;
  },
  
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },
  
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },
  
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },
  
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};

// API health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export const getCurrentApiUrl = (): string => {
  return getBaseURL();
};

export default api;