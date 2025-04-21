import axios from 'axios';
import { HearingAid } from './hearingAidService';

// Adjust this URL based on where your backend is running - should match hearingAidService.ts
const API_URL = 'http://192.168.0.244:8080/api';

// Cache for hearing aid 3D models and textures
const modelCache: Record<string, any> = {};

// Process an image on the backend to add a hearing aid overlay
export const processARImage = async (imageDataUrl: string, productId: string): Promise<string> => {
  try {
    // Extract base64 data from data URL (remove the prefix)
    const base64Data = imageDataUrl.split(',')[1];
    
    // Call the backend API to process the image
    const response = await axios.post(
      `${API_URL}/ar/process-image`, 
      {
        image: base64Data,
        productId
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        // Set longer timeout since image processing can take time
        timeout: 30000
      }
    );
    
    // The response contains the processed image as a data URL
    return response.data.processedImage;
  } catch (error) {
    console.error('Error processing AR image:', error);
    
    // In case of error, fall back to client-side processing
    return applyHearingAidToImage(imageDataUrl, await fetchHearingAid(productId), '#A0A0A0');
  }
};

// Fetch hearing aid data
const fetchHearingAid = async (productId: string): Promise<HearingAid> => {
  try {
    const response = await axios.get(`${API_URL}/hearingAids/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching hearing aid with ID ${productId}:`, error);
    throw error;
  }
};

// Ear detection parameters
const MIN_EAR_WIDTH = 60; // Minimum expected ear width in pixels
const EAR_COLOR_RANGE = {
  rMin: 150, rMax: 240,
  gMin: 100, gMax: 220,
  bMin: 80, bMax: 200
};

// Helper function to detect if a pixel might be part of an ear (based on color)
const isEarPixel = (r: number, g: number, b: number): boolean => {
  return r >= EAR_COLOR_RANGE.rMin && r <= EAR_COLOR_RANGE.rMax &&
         g >= EAR_COLOR_RANGE.gMin && g <= EAR_COLOR_RANGE.gMax &&
         b >= EAR_COLOR_RANGE.bMin && b <= EAR_COLOR_RANGE.bMax;
};

// Function to detect ear position in an image
const detectEarPosition = (imageData: ImageData): { x: number, y: number, width: number, height: number } | null => {
  const { data, width, height } = imageData;
  
  // Simple ear region detection by color
  // This is a simplified approach and can be improved with ML-based detection
  
  // Accumulate potential ear pixels
  const earPixels: { x: number, y: number }[] = [];
  
  // Check pixels for ear-like color
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      if (isEarPixel(r, g, b)) {
        earPixels.push({ x, y });
      }
    }
  }
  
  // If we have enough ear pixels, calculate the region
  if (earPixels.length > 100) {
    // Calculate bounds
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    
    earPixels.forEach(pixel => {
      minX = Math.min(minX, pixel.x);
      minY = Math.min(minY, pixel.y);
      maxX = Math.max(maxX, pixel.x);
      maxY = Math.max(maxY, pixel.y);
    });
    
    const earWidth = maxX - minX;
    const earHeight = maxY - minY;
    
    // If the region is too small, it might not be an ear
    if (earWidth < MIN_EAR_WIDTH) {
      return null;
    }
    
    return {
      x: minX,
      y: minY,
      width: earWidth,
      height: earHeight
    };
  }
  
  return null;
};

// Render AR overlay on the canvas based on video frame
export const renderAROverlay = (
  imageData: ImageData, 
  canvas: HTMLCanvasElement, 
  hearingAid: HearingAid,
  facingMode: 'user' | 'environment'
): void => {
  if (!canvas || !hearingAid) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Draw the original frame first
  ctx.putImageData(imageData, 0, 0);
  
  // Detect ear in the frame
  const earRegion = detectEarPosition(imageData);
  
  if (earRegion) {
    // Draw debug rectangle around detected ear (can be removed in production)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(earRegion.x, earRegion.y, earRegion.width, earRegion.height);
    
    // Calculate hearing aid position based on ear region
    const hearingAidX = facingMode === 'user'
      ? earRegion.x - (earRegion.width * 0.1) // Adjust for front camera mirror effect
      : earRegion.x + (earRegion.width * 0.2);
      
    const hearingAidY = earRegion.y + (earRegion.height * 0.3); // Position approximately at middle of ear
    
    // Calculate hearing aid dimensions proportional to ear size
    const hearingAidScale = earRegion.width / 200; // Adjust scale factor as needed
    const hearingAidWidth = 80 * hearingAidScale;
    const hearingAidHeight = 120 * hearingAidScale;
    
    // Draw hearing aid
    ctx.fillStyle = hearingAid.colors && hearingAid.colors.length > 0 
      ? hearingAid.colors[0] 
      : '#A0A0A0';
      
    // Draw hearing aid body
    ctx.beginPath();
    ctx.ellipse(
      hearingAidX, 
      hearingAidY, 
      hearingAidWidth * 0.3, 
      hearingAidHeight * 0.3, 
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw hearing aid tube
    ctx.beginPath();
    ctx.strokeStyle = hearingAid.colors && hearingAid.colors.length > 0 
      ? hearingAid.colors[0] 
      : '#A0A0A0';
    ctx.lineWidth = hearingAidWidth * 0.1;
    ctx.lineCap = 'round';
    ctx.moveTo(hearingAidX, hearingAidY);
    ctx.lineTo(
      hearingAidX + (facingMode === 'user' ? -hearingAidWidth * 0.3 : hearingAidWidth * 0.3), 
      hearingAidY + hearingAidHeight * 0.3
    );
    ctx.stroke();
    
    // Add product name label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      earRegion.x, 
      earRegion.y + earRegion.height + 10, 
      earRegion.width, 
      30
    );
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      hearingAid.name, 
      earRegion.x + earRegion.width / 2, 
      earRegion.y + earRegion.height + 30
    );
  }
};

// Get a frame from video for processing
export const captureVideoFrame = (video: HTMLVideoElement): string => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw video frame to canvas
  ctx.drawImage(video, 0, 0);
  
  // Convert to data URL
  return canvas.toDataURL('image/jpeg', 0.9);
};

// Load and apply hearing aid model to an image
export const applyHearingAidToImage = async (
  imageDataUrl: string,
  hearingAid: HearingAid,
  colorHex: string
): Promise<string> => {
  // Create an image element to load the source image
  const img = new Image();
  img.src = imageDataUrl;
  
  // Wait for the image to load
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });
  
  // Create a canvas to process the image
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw the image to the canvas
  ctx.drawImage(img, 0, 0);
  
  // Get image data for ear detection
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Detect ear in the image
  const earRegion = detectEarPosition(imageData);
  
  if (earRegion) {
    // Draw the hearing aid on the ear
    // Similar to renderAROverlay but for a static image
    
    // Calculate hearing aid position based on ear region
    const hearingAidX = earRegion.x + (earRegion.width * 0.2);
    const hearingAidY = earRegion.y + (earRegion.height * 0.3);
    
    // Calculate hearing aid dimensions proportional to ear size
    const hearingAidScale = earRegion.width / 200;
    const hearingAidWidth = 80 * hearingAidScale;
    const hearingAidHeight = 120 * hearingAidScale;
    
    // Draw hearing aid
    ctx.fillStyle = colorHex || (hearingAid.colors && hearingAid.colors.length > 0 
      ? hearingAid.colors[0] 
      : '#A0A0A0');
    
    // Draw hearing aid body
    ctx.beginPath();
    ctx.ellipse(
      hearingAidX, 
      hearingAidY, 
      hearingAidWidth * 0.3, 
      hearingAidHeight * 0.3, 
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw hearing aid tube
    ctx.beginPath();
    ctx.strokeStyle = colorHex || (hearingAid.colors && hearingAid.colors.length > 0 
      ? hearingAid.colors[0] 
      : '#A0A0A0');
    ctx.lineWidth = hearingAidWidth * 0.1;
    ctx.lineCap = 'round';
    ctx.moveTo(hearingAidX, hearingAidY);
    ctx.lineTo(
      hearingAidX + hearingAidWidth * 0.3, 
      hearingAidY + hearingAidHeight * 0.3
    );
    ctx.stroke();
    
    // Add product info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      earRegion.x, 
      earRegion.y + earRegion.height + 10, 
      earRegion.width, 
      30
    );
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      hearingAid.name, 
      earRegion.x + earRegion.width / 2, 
      earRegion.y + earRegion.height + 30
    );
  }
  
  // Convert the processed canvas to data URL
  return canvas.toDataURL('image/jpeg', 0.9);
}; 