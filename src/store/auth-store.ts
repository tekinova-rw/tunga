// src/store/auth-store.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

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

  login: (user: User, token: string, refreshToken?: string) => Promise<void>;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  validateSession: () => Promise<boolean>;
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

  // ======================
  // LOGIN - FIXED ✅
  // ======================
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
        isLoading: false,
        hydrated: true, // ✅ CRITICAL FIX: Set hydrated to true
      });

      console.log('✅ Login successful, store updated with hydrated: true');
    } catch (error) {
      console.error('Login storage error:', error);
      throw error;
    }
  },

  // ======================
  // SET AUTH - FIXED ✅
  // ======================
  setAuth: (user, token, refreshToken) => {
    set({
      user,
      token,
      refreshToken: refreshToken || null,
      isLoading: false,
      hydrated: true, // ✅ CRITICAL FIX: Set hydrated to true
    });
    
    console.log('✅ setAuth called, hydrated: true');
  },

  // ======================
  // UPDATE USER
  // ======================
  setUser: (user) => {
    set({ user });
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)).catch(console.error);
  },

  // ======================
  // UPDATE TOKEN
  // ======================
  setToken: (token) => {
    set({ token });
    AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token).catch(console.error);
  },

  // ======================
  // UPDATE REFRESH TOKEN
  // ======================
  setRefreshToken: (refreshToken) => {
    set({ refreshToken });
    AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken).catch(console.error);
  },

  // ======================
  // CLEAR SESSION
  // ======================
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
        isLoading: false,
        hydrated: true, // Keep hydrated true after clearing
      });
      
      console.log('✅ Session cleared');
    } catch (error) {
      console.error('Clear session error:', error);
    }
  },

  // ======================
  // LOGOUT
  // ======================
  logout: async () => {
    const { token, clearSession } = get();

    if (token) {
      try {
        const { api } = await import('../api/axios');
        await api.post('/auth/logout', { refreshToken: token });
      } catch (error) {
        console.log('Logout API error ignored');
      }
    }

    await clearSession();
  },

  // ======================
  // HYDRATE
  // ======================
  hydrate: async () => {
    try {
      const [userStr, token, refreshToken] = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);

      const user = userStr[1] ? JSON.parse(userStr[1]) : null;

      set({
        user,
        token: token[1] || null,
        refreshToken: refreshToken[1] || null,
        hydrated: true,
        isLoading: false,
      });

      console.log('✅ Auth hydrated:', {
        hasUser: !!user,
        hasToken: !!token[1],
        role: user?.role,
      });
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

  // ======================
  // VALIDATE SESSION
  // ======================
  validateSession: async () => {
    const { token, user, clearSession } = get();

    if (!token || !user) return false;

    try {
      const { api } = await import('../api/axios');
      await api.get('/auth/profile');
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        await clearSession();
        return false;
      }

      return true;
    }
  },

  // ======================
  // RESET
  // ======================
  reset: () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      hydrated: true,
      isLoading: false,
    });
    
    console.log('✅ Store reset');
  },
}));

// ======================
// HELPERS
// ======================
export const useUser = () => useAuthStore((s) => s.user);
export const useToken = () => useAuthStore((s) => s.token);
export const useIsAuthenticated = () =>
  useAuthStore((s) => !!s.user && !!s.token);
export const useHydrated = () => useAuthStore((s) => s.hydrated);

export const hasRole = (role: User['role']) => {
  return useAuthStore.getState().user?.role === role;
};

export const isAdmin = () => {
  const user = useAuthStore.getState().user;
  return user?.role === 'super_admin' || user?.role === 'district_admin';
};

export const isFarmer = () => {
  return useAuthStore.getState().user?.role === 'farmer';
};

export const isVeterinarian = () => {
  return useAuthStore.getState().user?.role === 'veterinarian';
};

export const validateSession = () => {
  return useAuthStore.getState().validateSession();
};