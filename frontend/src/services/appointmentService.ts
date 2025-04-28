// src/services/appointmentService.ts
import axios from 'axios';

// Adjust this URL based on where your backend is running
const API_URL = '/api';

// Interfaces
export interface UserDetails {
  firstName: string;
  surname: string;
  addressNumber: string;
  street: string;
  city: string;
  county: string;
  postcode: string;
}

export interface AppointmentRequest {
  appointmentTypeId: string;
  date: string;
  time: string;
  userId?: string;
  notes?: string;
  userDetails: UserDetails;
}

export interface AppointmentResponse {
  success: boolean;
  appointmentId?: string;
  message: string;
}

export interface Appointment {
  id: string;
  audiologistId: string;
  appointmentType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  userId: string;
  notes?: string;
  userDetails: UserDetails;
}

// Get available time slots for a specific date and appointment type
export const getAvailableTimeSlots = async (date: string, appointmentTypeId: string): Promise<string[]> => {
  try {
    const response = await axios.get<string[]>(
      `${API_URL}/appointments/available?date=${date}&appointmentTypeId=${appointmentTypeId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return [];
  }
};

// Book an appointment
export const bookAppointment = async (appointmentData: AppointmentRequest): Promise<AppointmentResponse> => {
  try {
    const response = await axios.post<AppointmentResponse>(
      `${API_URL}/appointments/book`, 
      appointmentData
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data as AppointmentResponse;
    }
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
};

// Get all appointments for a specific user
export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
  if (!userId) {
    console.error('Error: No userId provided to getUserAppointments');
    return [];
  }

  try {
    // Check if userId looks like an email
    const isEmail = userId.includes('@');
    if (isEmail) {
      console.warn('Warning: Using an email address as userId. This might not match the format expected by the backend.');
      // If you want to extract a user ID from an email, you could do something like this:
      // const emailPrefix = userId.split('@')[0];
      // console.log(`Converting email to simpler ID: ${emailPrefix}`);
      // userId = emailPrefix;
    }

    // URL encode the userId to handle special characters
    const encodedUserId = encodeURIComponent(userId);
    console.log(`Fetching appointments for user ID: ${encodedUserId}`);
    
    try {
      const response = await axios.get<Appointment[]>(
        `${API_URL}/appointments/user/${encodedUserId}`,
        {
          // Add timeout to prevent long-hanging requests
          timeout: 10000
        }
      );
      
      console.log(`Successfully fetched ${response.data.length} appointments`);
      return response.data;
    } catch (axiosError) {
      console.error('Could not fetch appointments from server, checking for test data');
      
      // If this is a development environment, we could provide mock data for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Using empty mock data for development');
      }
      
      // Re-throw to be caught by the outer try-catch
      throw axiosError;
    }
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    
    // More detailed error logging
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with a status code outside the 2xx range
        console.error('Server error response:', error.response.status, error.response.data);
      } else if (error.request) {
        // Request was made but no response was received
        console.error('No response received from server. The server might be down or the endpoint might not exist.');
        console.error('Request details:', {
          method: 'GET',
          url: `${API_URL}/appointments/user/${userId}`,
          timeout: '10000ms'
        });
      } else {
        // Something happened in setting up the request
        console.error('Error setting up the request:', error.message);
      }
    }
    
    return [];
  }
};

// Get an available audiologist for a specific date, time, and appointment type
export const getAvailableAudiologist = async (date: string, time: string, appointmentTypeId: string) => {
  try {
    console.log(`Finding available audiologist for date: ${date}, time: ${time}, type: ${appointmentTypeId}`);
    const response = await axios.get(
      `${API_URL}/appointments/available-audiologist?date=${date}&time=${time}&appointmentTypeId=${appointmentTypeId}`,
      {
        timeout: 10000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error finding available audiologist:', error);
    
    // More detailed error logging
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if (error.response.status === 404) {
          console.warn('No available audiologist found for the selected time slot');
        } else {
          console.error('Server error response:', error.response.status, error.response.data);
        }
      } else if (error.request) {
        console.error('No response received from server');
      }
    }
    
    return null;
  }
};

// Get all appointments for a specific audiologist
export const getAudiologistAppointments = async (audiologistId: string): Promise<Appointment[]> => {
  if (!audiologistId) {
    console.error('Error: No audiologistId provided to getAudiologistAppointments');
    return [];
  }

  try {
    // URL encode the audiologistId to handle special characters
    const encodedAudiologistId = encodeURIComponent(audiologistId);
    console.log(`Fetching appointments for audiologist ID: ${encodedAudiologistId}`);
    
    try {
      const response = await axios.get<Appointment[]>(
        `${API_URL}/appointments/audiologist/${encodedAudiologistId}`,
        {
          // Add timeout to prevent long-hanging requests
          timeout: 10000
        }
      );
      
      console.log(`Successfully fetched ${response.data.length} appointments for audiologist`);
      return response.data;
    } catch (axiosError) {
      console.error('Could not fetch audiologist appointments from server');
      
      // If this is a development environment, we could provide mock data for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Using empty mock data for development');
      }
      
      // Re-throw to be caught by the outer try-catch
      throw axiosError;
    }
  } catch (error) {
    console.error('Error fetching audiologist appointments:', error);
    
    // More detailed error logging
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with a status code outside the 2xx range
        console.error('Server error response:', error.response.status, error.response.data);
      } else if (error.request) {
        // Request was made but no response was received
        console.error('No response received from server. The server might be down or the endpoint might not exist.');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up the request:', error.message);
      }
    }
    
    return [];
  }
};