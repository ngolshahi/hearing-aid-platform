// src/services/authService.ts
import axios from 'axios';

// Adjust this URL based on where your backend is running
const API_URL = 'http://localhost:8080/api';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string | null;
  token: string | null;
  message: string;
}

// Register a new user
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(`${API_URL}/users/register`, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as AuthResponse;
    }
    return {
      userId: null,
      token: null,
      message: 'Network error occurred'
    };
  }
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(`${API_URL}/users/login`, data);
    return response.data;
    
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as AuthResponse;
    }
    return {
      userId: null,
      token: null,
      message: 'Network error occurred'
    };
  }
};

// Log out the current user
export const logout = (): void => {
  localStorage.removeItem('user');
};

// Get the current logged-in user from localStorage
export const getCurrentUser = (): AuthResponse | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Check if a user is currently logged in
export const isAuthenticated = (): boolean => {
  return getCurrentUser()?.token !== undefined;
};