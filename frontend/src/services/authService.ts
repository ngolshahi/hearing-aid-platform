import axios from 'axios';
import { UserDetails } from './appointmentService';

// Adjust this URL based on where your backend is running
const API_URL = 'http://192.168.0.244:8080/api';

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

export interface LoginResponse {
  user: User | null;
  verified: boolean;
  message: string;
}

export interface ResendVerificationResponse {
  message: string;
}

// Register a new user
export const register = async (data: RegisterRequest): Promise<{ user: User | null, message: string }> => {
  try {
    const response = await axios.post<any>(`${API_URL}/users/register`, data);
    
    // Just return the response regardless of whether user is null
    // The message will indicate verification is needed
    return {
      user: response.data.user,
      message: response.data.message || "Registration successful"
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Return the specific error message from the backend
      const errorMessage = error.response.data?.message || "Registration failed";
      console.error("Registration error:", errorMessage);
      return {
        user: null,
        message: errorMessage
      };
    }
    return {
      user: null,
      message: "Network error or server unavailable"
    };
  }
};

// Login with improved error handling for verification status
export const login = async (data: LoginRequest): Promise<{ user: User | Audiologist | null, message: string, verified: boolean }> => {
  try {
    // Try user login first
    const response = await axios.post<any>(`${API_URL}/users/login`, data);
    
    if (response.data && response.data.email) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return {
        user: response.data,
        message: '',
        verified: true
      };
    }
    
    return {
      user: null,
      message: response.data?.message || "Unknown error",
      verified: response.data?.verified || false
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Check for verification error (403 Forbidden)
      if (error.response.status === 403) {
        // Email not verified
        return {
          user: null,
          message: error.response.data?.message || "Your email is not verified",
          verified: false
        };
      }
      
      try {
        // If user login fails, try audiologist login
        const audiologistResponse = await axios.post<Audiologist>(`${API_URL}/audiologists/login`, data);
        if (audiologistResponse.data.email) {
          localStorage.setItem('user', JSON.stringify(audiologistResponse.data));
          return {
            user: audiologistResponse.data,
            message: '',
            verified: true
          };
        }
      } catch (innerError) {
        // Both login attempts failed
      }
      
      return {
        user: null,
        message: error.response.data?.message || "Invalid email or password",
        verified: error.response.data?.verified || false
      };
    }
    
    return {
      user: null,
      message: "Network error or server unavailable",
      verified: false
    };
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
export const updateUserProfile = async (data: User): Promise<User | null> => {
  try {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const response = await axios.put<User>(`${API_URL}/users/${currentUser.id}`, data);
      return response.data;
    } else {
       console.error(`Not logged in`);
       return null
    }
  } catch (error) {
    console.error(`Error updating user profile for user`);
    return null;
  }
};

export const updateAudiologistProfile = async (data: Audiologist): Promise<Audiologist | null> => {
  try {
    const currentUser = getCurrentUser();
    console.log(currentUser);
    if (currentUser) {
      const response = await axios.put<Audiologist>(`${API_URL}/audiologists/${currentUser.id}`, data);
      return response.data;
    } else {
      console.error("Not logged in")
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // More detailed error logging
      console.error(`Error updating audiologist profile: ${error.message}`);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
};

// Verify email with token
export const verifyEmail = async (email: string, token: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await axios.post<any>(`${API_URL}/users/verify-email`, { email, token });
    return {
      success: true,
      message: response.data.message || "Email verified successfully"
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || "Failed to verify email"
      };
    }
    return {
      success: false,
      message: "Network error or server unavailable"
    };
  }
};

// Resend verification email
export const resendVerification = async (email: string): Promise<{ success: boolean, message: string }> => {
  try {
    const response = await axios.post<ResendVerificationResponse>(
      `${API_URL}/users/resend-verification`, 
      { email }
    );
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || "Failed to resend verification email"
      };
    }
    return {
      success: false,
      message: "Network error or server unavailable"
    };
  }
};

// Check email verification status
export const checkVerificationStatus = async (email: string): Promise<boolean> => {
  try {
    const response = await axios.get<{ verified: boolean }>(`${API_URL}/users/check-verification/${email}`);
    return response.data.verified;
  } catch (error) {
    return false;
  }
};