// src/services/appointmentService.ts
import axios from 'axios';

// Adjust this URL based on where your backend is running
const API_URL = 'http://localhost:8080/api';

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