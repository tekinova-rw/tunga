// src/store/auth-store.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  role: 'super_admin' | 'district_admin' | 'veterinarian' | 'farmer';
  district_id: number;
  status?: string;
  is_verified?: boolean;
  is_active?: boolean;
  profile_image?: string | null;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  isLoading: boolean;

  // Actions
  login: (user: User, token: string, refreshToken?: string) => Promise<void>;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  validateSession: () => Promise<boolean>; // ✅ ADD THIS
  reset: () => void;
}

const STORAGE_KEYS = {
  USER: '@auth_user',
  TOKEN: '@auth_token',
  REFRESH_TOKEN: '@auth_refresh_token',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  hydrated: false,
  isLoading: false,

  /**
   * 🔐 LOGIN (with AsyncStorage)
   */
  login: async (user, token, refreshToken) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER, JSON.stringify(user)],
        [STORAGE_KEYS.TOKEN, token],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''],
      ]);

      set({ 
        user, 
        token, 
        refreshToken: refreshToken || null,
        isLoading: false 
      });
    } catch (error) {
      console.error('Login storage error:', error);
      throw error;
    }
  },

  /**
   * ⚡ SIMPLE SET AUTH (NO AsyncStorage)
   * used after API login if you don't want async storage again
   */
  setAuth: (user, token, refreshToken) => {
    set({ 
      user, 
      token, 
      refreshToken: refreshToken || null,
      isLoading: false 
    });
  },

  /**
   * 👤 UPDATE USER
   */
  setUser: (user) => {
    set({ user });
    // Update stored user
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)).catch(console.error);
  },

  /**
   * 🎫 UPDATE TOKEN
   */
  setToken: (token) => {
    set({ token });
    AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token).catch(console.error);
  },

  /**
   * 🔄 UPDATE REFRESH TOKEN
   */
  setRefreshToken: (refreshToken) => {
    set({ refreshToken });
    AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken).catch(console.error);
  },

  /**
   * 🚪 CLEAR SESSION (local only, no API call)
   */
  clearSession: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
      set({ 
        user: null, 
        token: null, 
        refreshToken: null,
        isLoading: false 
      });
    } catch (error) {
      console.error('Clear session error:', error);
    }
  },

  /**
   * 🚪 LOGOUT (with API call if token exists)
   */
  logout: async () => {
    const { token, clearSession } = get();
    
    // Try to call logout API if token exists
    if (token) {
      try {
        // Import api dynamically to avoid circular dependency
        const { api } = await import('../api/axios');
        await api.post('/auth/logout', { refreshToken: token });
        console.log('✅ Logout API called successfully');
      } catch (error: any) {
        // If 401, token is already invalid
        if (error?.response?.status === 401) {
          console.log('Token already invalid, skipping API logout');
        } else {
          console.error('Logout API error:', error?.response?.data || error.message);
        }
      }
    }

    // Clear local storage and state
    await clearSession();
    console.log('✅ User logged out successfully');
  },

  /**
   * 🔄 HYDRATE (restore session from storage)
   */
  hydrate: async () => {
    try {
      const [userStr, token, refreshToken] = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);

      const user = userStr[1] ? JSON.parse(userStr[1]) : null;
      const authToken = token[1] || null;
      const refreshTokenStr = refreshToken[1] || null;

      set({
        user,
        token: authToken,
        refreshToken: refreshTokenStr,
        hydrated: true,
        isLoading: false,
      });

      console.log('✅ Auth hydrated:', { 
        hasUser: !!user, 
        hasToken: !!authToken,
        hasRefreshToken: !!refreshTokenStr 
      });

      // ✅ Fixed: Validate session with backend
      // Use setTimeout to avoid calling validateSession during hydration
      if (user && authToken) {
        setTimeout(() => {
          get().validateSession();
        }, 100);
      }

    } catch (error) {
      console.error('Hydrate error:', error);
      set({ 
        hydrated: true, 
        isLoading: false,
        user: null,
        token: null,
        refreshToken: null,
      });
    }
  },

  /**
   * 🔍 VALIDATE SESSION with backend
   * Checks if token is still valid and user exists
   */
  validateSession: async () => {
    const { token, user, clearSession } = get();
    
    if (!token || !user) {
      return false;
    }

    try {
      const { api } = await import('../api/axios');
      
      // Try to get user profile to validate token
      const response = await api.get('/auth/profile');
      const userData = response.data.data || response.data;
      
      // Update user data if changed
      if (JSON.stringify(userData) !== JSON.stringify(user)) {
        set({ user: userData });
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      }
      
      console.log('✅ Session validated successfully');
      return true;
      
    } catch (error: any) {
      console.log('❌ Session validation failed:', error?.response?.status);
      
      // Token invalid or user deleted
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        await clearSession();
        console.log('🧹 Session cleared due to invalid token');
        return false;
      }
      
      // Network error - keep session but mark as invalid
      if (error?.message === 'Network Error') {
        console.log('⚠️ Network error during validation, keeping session');
        return true; // Keep session, will retry later
      }
      
      return false;
    }
  },

  /**
   * 🔄 RESET STORE (clear all state)
   */
  reset: () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      hydrated: true,
      isLoading: false,
    });
  },
}));

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user && !!state.token);
export const useHydrated = () => useAuthStore((state) => state.hydrated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);

// Utility function to check if user has specific role
export const hasRole = (role: User['role']) => {
  const user = useAuthStore.getState().user;
  return user?.role === role;
};

// Utility function to check if user is admin
export const isAdmin = () => {
  const user = useAuthStore.getState().user;
  return user?.role === 'super_admin' || user?.role === 'district_admin';
};

// Utility function to check if user is farmer
export const isFarmer = () => {
  const user = useAuthStore.getState().user;
  return user?.role === 'farmer';
};

// Utility function to check if user is veterinarian
export const isVeterinarian = () => {
  const user = useAuthStore.getState().user;
  return user?.role === 'veterinarian';
};

// ✅ Export a function to manually validate session from anywhere
export const validateSession = () => {
  return useAuthStore.getState().validateSession();
};