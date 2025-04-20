// src/services/audiologistService.ts
import axios from 'axios';

// Adjust this URL based on where your backend is running
const API_URL = 'http://192.168.0.244:8080/api';

// Interfaces
export interface WorkHours {
  start: string;
  end: string;
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
}

// Get all audiologists
export const getAllAudiologists = async (): Promise<Audiologist[]> => {
  try {
    const response = await axios.get<Audiologist[]>(`${API_URL}/audiologists`);
    return response.data;
  } catch (error) {
    console.error('Error fetching audiologists:', error);
    return [];
  }
};

// Get audiologist details by ID
export const getAudiologistById = async (id: string): Promise<Audiologist | null> => {
    try {
      const response = await axios.get<Audiologist>(`${API_URL}/audiologists/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching audiologist with ID ${id}:`, error);
      return null;
    }
  };

// Update an audiologist
export const updateAudiologist = async (audiologist: Audiologist): Promise<Audiologist | null> => {
  try {
    const response = await axios.put<Audiologist>(
      `${API_URL}/audiologists/${audiologist.id}`,
      audiologist
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating audiologist with ID ${audiologist.id}:`, error);
    return null;
  }
};

// Update specific fields of an audiologist
export const updateAudiologistFields = async (
  id: string,
  fields: Partial<Audiologist>
): Promise<Audiologist | null> => {
  try {
    // First get the current audiologist
    const currentAudiologist = await getAudiologistById(id);
    if (!currentAudiologist) {
      return null;
    }
    
    // Merge the current audiologist with the updated fields
    const updatedAudiologist = { ...currentAudiologist, ...fields };
    
    // Send the updated audiologist to the server
    const response = await axios.put<Audiologist>(
      `${API_URL}/audiologists/${id}`,
      updatedAudiologist
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating audiologist fields for ID ${id}:`, error);
    return null;
  }
};