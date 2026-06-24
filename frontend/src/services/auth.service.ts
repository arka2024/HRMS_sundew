import { API_URLS, STORAGE_KEYS } from '../constants';
import { apiRequest } from './api.client';
import type { AuthResponse, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>(API_URLS.AUTH, '/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string, role: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>(API_URLS.AUTH, '/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const data = await apiRequest<{ user: User | null }>(API_URLS.AUTH, '/me', { token });
      return data.user;
    } catch {
      return null;
    }
  },

  async logout(token: string): Promise<void> {
    await apiRequest(API_URLS.AUTH, '/logout', {
      method: 'POST',
      token,
    });
  },

  persistSession(user: User, token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  },

  getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  getStoredUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
};
