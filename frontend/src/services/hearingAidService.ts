import axios from 'axios';

// Adjust this URL based on where your backend is running
const API_URL = '/api';

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
  visualiserConfig?: {
    modelType: string;
    brandLine?: string;
  };
}

// Get all hearing aids
export const getHearingAids = async (): Promise<HearingAid[]> => {
  try {
    const response = await axios.get<HearingAid[]>(`/api/hearingAids`);
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

/*
When adding or updating hearing aids in your database, include visualiserConfig for models
that support 3D visualization. Examples:

For an mRIC model:
{
  "id": "2",
  "name": "Edge AI 24 mRIC",
  ...
  "visualiserConfig": {
    "modelType": "mric-r",
    "brandLine": "genesis-ai"
  }
}

For a RIC-RT model:
{
  "id": "3",
  "name": "Genesis AI RIC-RT",
  ...
  "visualiserConfig": {
    "modelType": "ric-rt",
    "brandLine": "genesis-ai"
  }
}
*/