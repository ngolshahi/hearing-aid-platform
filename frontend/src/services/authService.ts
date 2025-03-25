import axios from 'axios';
import { UserDetails } from './appointmentService';

// Adjust this URL based on where your backend is running
const API_URL = 'http://localhost:8080/api';

// Authentication interfaces
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
  email: string | null;
  token: string | null;
  message: string;
  userType?: 'user' | 'audiologist';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
}

export interface AudiologistProfile extends UserProfile {
  description: string;
  qualifications: string;
  workSchedule: Record<string, WorkHours>;
}

export interface WorkHours {
  start: string;
  end: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  image?: string;
  details?: UserDetails;
}

export interface Audiologist {
  id: string;
  name: string;
  image: string;
  description: string;
  qualifications: string;
  email: string;
  phone: string;
  workSchedule: Record<string, WorkHours>;
  password: string;
}



// Register a new user
export const register = async (data: RegisterRequest): Promise<User | null> => {
  try {
    const response = await axios.post<User>(`${API_URL}/users/register`, data);
    if (response.data.email) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return null;
    }
    return null;
  }
};

export const login = async (data: LoginRequest): Promise<User | Audiologist | null> => {
  try {
    // Try user login first
    const response = await axios.post<User>(`${API_URL}/users/login`, data);
    if (response.data.email) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    try {
      // If user login fails, try audiologist login
      const audiologistResponse = await axios.post<Audiologist>(`${API_URL}/audiologists/login`, data);
      if (audiologistResponse.data.email) {
        localStorage.setItem('user', JSON.stringify(audiologistResponse.data));
      }
      return audiologistResponse.data;
    } catch (innerError) {
      if (axios.isAxiosError(innerError) && innerError.response) {
        return null;
      }
      return null;
    }
  }
};

// Log out the current user
export const logout = (): void => {
  localStorage.removeItem('user');
  window.location.reload();
};

// Get the current logged-in user from localStorage
export const getCurrentUser = (): User | Audiologist | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Check if a user is currently logged in
export const isAuthenticated = (): boolean => {
  return getCurrentUser()?.email !== undefined && getCurrentUser()?.email !== null;
};

// Get user profile
export const getUserProfile = async (email: string): Promise<User | null> => {
  try {
    const response = await axios.get<User>(`${API_URL}/users/${email}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user profile for ${email}:`, error);
    return null;
  }
};

// Get audiologist profile
export const getAudiologistProfile = async (email: string): Promise<Audiologist| null> => {
  try {
    const response = await axios.get<Audiologist>(`${API_URL}/audiologists/${email}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching audiologist profile for ${email}:`, error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (email: string, data: Partial<User>): Promise<User | null> => {
  try {
    const response = await axios.put<User>(`${API_URL}/users/${email}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating user profile for ${email}:`, error);
    return null;
  }
};

// Update audiologist profile
export const updateAudiologistProfile = async (email: string, data: Partial<Audiologist>): Promise<Audiologist | null> => {
  try {
    const response = await axios.put<Audiologist>(`${API_URL}/audiologists/${email}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating audiologist profile for ${email}:`, error);
    return null;
  }
};