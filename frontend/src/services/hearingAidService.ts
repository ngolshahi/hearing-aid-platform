import axios from 'axios';

// Adjust this URL based on where your backend is running
const API_URL = 'http://localhost:8080/api';

// Feature interface for hearing aids
export interface Feature {
  icon: string;
  title: string;
  description: string;
}

// Hearing Aid interface
export interface HearingAid {
  id: string;
  name: string;
  subtitle?: string;
  brand: string;
  type: string;
  price: number;
  rating: number;
  releaseDate: string;
  colors: string[];
  image: string;
  images?: string[];
  description: string;
  features?: Feature[];
  specifications?: Record<string, string>;
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}

// Get all hearing aids
export const getHearingAids = async (): Promise<HearingAid[]> => {
  try {
    const response = await axios.get<HearingAid[]>(`${API_URL}/hearingAids`);
    return response.data;
  } catch (error) {
    console.error('Error fetching hearing aids:', error);
    throw error;
  }
};

// Get a specific hearing aid by ID
export const getHearingAidById = async (id: string): Promise<HearingAid> => {
  try {
    const response = await axios.get<HearingAid>(`${API_URL}/hearingAids/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching hearing aid with ID ${id}:`, error);
    throw error;
  }
};