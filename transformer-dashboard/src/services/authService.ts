import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = 'http://localhost:8080/api/auth';

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    tokenStorage.setToken(data.token);
    tokenStorage.setUser(data.user);
    return data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const { confirmPassword, ...registerData } = userData;
    
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    tokenStorage.setToken(data.token);
    tokenStorage.setUser(data.user);
    return data;
  },

  logout: (): void => {
    tokenStorage.clear();
  },

  getCurrentUser: (): User | null => {
    return tokenStorage.getUser();
  },

  isAuthenticated: (): boolean => {
    return !!tokenStorage.getToken();
  },

  getAuthHeader: (): { Authorization: string } | {} => {
    const token = tokenStorage.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
