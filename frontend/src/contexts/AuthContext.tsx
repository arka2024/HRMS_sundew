import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { getDashboardRouteForRole } from '../constants';
import { authService } from '../services/auth.service';
import { ApiClientError } from '../services/api.client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const storedToken = authService.getStoredToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser(storedToken);

        if (currentUser) {
          setUser(currentUser);
          setToken(storedToken);
          authService.persistSession(currentUser, storedToken);
        } else {
          authService.clearSession();
          setUser(null);
          setToken(null);
        }
      } catch {
        authService.clearSession();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      authService.persistSession(response.user, response.token);
      setUser(response.user);
      setToken(response.token);
      toast.success(`Welcome back, ${response.user.name}`);
      return getDashboardRouteForRole(response.user.role);
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await authService.logout(token);
      } catch {
        // Clear local session even if logout API fails
      }
    }

    authService.clearSession();
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
