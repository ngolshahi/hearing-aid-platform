import axios from 'axios';
import { HearingAid } from './hearingAidService';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Adjust this URL based on where your backend is running - should match hearingAidService.ts
const API_URL = 'http://192.168.0.244:8080/api';

// Cache for hearing aid 3D models and textures
const modelCache: Record<string, THREE.Group> = {};
const textureCache: Record<string, THREE.Texture> = {};
const imageCache: Record<string, HTMLImageElement> = {};

interface ARProcessResponse {
  processedImage: string;
  success: boolean;
  message?: string;
  fallbackMode?: boolean;
}

/**
 * 2D Hearing Aid Image Paths - dynamically generated based on product ID
 * Each product has its own folder with a main.png file
 */
const getHearingAidImagePath = (productId: string): string => {
  return `/images/${productId}/main.png`;
};

// Preload the hearing aid images for faster rendering
export const preloadHearingAidImages = async (productIds: string[]): Promise<void> => {
  productIds.forEach(productId => {
    const path = getHearingAidImagePath(productId);
    if (!imageCache[path]) {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        console.log(`Preloaded hearing aid image: ${path}`);
        imageCache[path] = img;
      };
    }
  });
};

// Load 3D model (used as fallback)
const loadModel = async (): Promise<THREE.Group> => {
  if (modelCache['hearing-aid']) {
    return modelCache['hearing-aid'];
  }

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load('/models/hearing-aid-model.glb', (gltf: any) => {
      const model = gltf.scene;
      // Cache the model
      modelCache['hearing-aid'] = model;
      resolve(model);
    }, undefined, (error: any) => {
      console.error('Error loading hearing aid model:', error);
      reject(error);
    });
  });
};

// Process an image on the backend to add a hearing aid overlay
export const processARImage = async (imageDataUrl: string, productId: string): Promise<string> => {
  try {
    // First try client-side processing for better results
    console.log('Attempting client-side processing for product ID:', productId);
    
    const hearingAid = await fetchHearingAid(productId);
    
    // Use client-side image processing for better quality
    return await applyHearingAidToImage(imageDataUrl, hearingAid, productId);
  } catch (clientError) {
    console.error('Client-side processing failed, trying server-side:', clientError);
    
    // Fall back to server-side processing
    try {
      // Extract base64 data from data URL
      let base64Data = imageDataUrl.split(',')[1];
      
      // Check if we have valid base64 data
      if (!base64Data) {
        console.error('Invalid image data URL format');
        throw new Error('Invalid image format');
      }

      // Clean the base64 data
      base64Data = base64Data.trim();
      
      // Call the backend API
      const response = await axios.post<ARProcessResponse>(
        `${API_URL}/ar/process-image`, 
        {
          image: base64Data,
          productId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );
      
      console.log('Server response status:', response.status);
      
      // Check if we got a successful response
      if (response.data.success && response.data.processedImage) {
        let processedImage = response.data.processedImage;
        
        // Add data URL prefix if needed
        if (!processedImage.startsWith('data:image')) {
          processedImage = `data:image/png;base64,${processedImage}`;
        }
        
        return processedImage;
      } else {
        console.error('Server returned unsuccessful response:', response.data);
        throw new Error(response.data.message || 'Failed to process image on server');
      }
    } catch (error: any) {
      console.error('Both client-side and server-side processing failed:', error);
      throw new Error('Failed to process image. Please try a different photo or check your connection.');
    }
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

// Load an image asynchronously
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (imageCache[src]) {
      resolve(imageCache[src]);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache[src] = img;
      resolve(img);
    };
    img.onerror = (e) => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
};

// Apply hearing aid to image using the product's PNG image
export const applyHearingAidToImage = async (
  imageDataUrl: string,
  hearingAid: HearingAid,
  productId: string
): Promise<string> => {
  // Create an image element to load the source image
  const img = new Image();
  img.crossOrigin = 'anonymous';
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
  
  // Draw the original image to the canvas
  ctx.drawImage(img, 0, 0);
  
  // Get image data for ear detection
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  try {
    // Get product-specific hearing aid image path
    const hearingAidImagePath = getHearingAidImagePath(productId);
    
    // Try loading the 2D image
    const hearingAidImg = await loadImage(hearingAidImagePath);
    
    // Calculate ear position - for 2D image we'll use a simple detection
    const earPosition = detectEarPosition(imageData);
    
    // Only proceed if we detected an ear position
    if (earPosition) {
      // Calculate size for hearing aid image - adjust based on ear size and image type
      // Detect if this is a close-up ear image (like the one shared by the user)
      const isCloseup = earPosition.width > canvas.width / 3; // Ear takes up significant portion of image
      
      // Make the hearing aid smaller for close-up images
      const scaleFactorWidth = isCloseup ? 
        Math.max(0.5, Math.min(0.7, canvas.width / 1000)) : // Much smaller for close-ups
        Math.max(0.8, Math.min(1.0, canvas.width / 800));   // Regular size for normal images
        
      const hearingAidWidth = earPosition.width * scaleFactorWidth;
      const hearingAidHeight = hearingAidWidth * (hearingAidImg.height / hearingAidImg.width);
      
      // Position the hearing aid behind the ear for a more subtle look
      // Adjust position based on whether it's a close-up or not
      const positionOffsetX = earPosition.isRightEar ? 
        (isCloseup ? 0.7 : 0.6) :  // For right ear, position behind the ear
        (isCloseup ? -0.2 : -0.1); // For left ear, position behind the ear
        
      const hearingAidX = earPosition.isRightEar 
        ? earPosition.x + (earPosition.width * positionOffsetX)
        : earPosition.x + (earPosition.width * positionOffsetX);
      
      // Position at ear level, slightly above the center
      const hearingAidY = earPosition.y - (hearingAidHeight * 0.15);
      
      // Save context for rotation
      ctx.save();
      
      // Apply rotation if needed (around the hearing aid center)
      if (earPosition.rotation !== 0) {
        const centerX = hearingAidX + hearingAidWidth / 2;
        const centerY = hearingAidY + hearingAidHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(earPosition.rotation);
        ctx.translate(-centerX, -centerY);
      }
      
      // For right ear, we need to flip the image horizontally
      if (earPosition.isRightEar) {
        ctx.scale(-1, 1);
        ctx.translate(-2 * hearingAidX - hearingAidWidth, 0);
      }
      
      // Draw hearing aid image
      ctx.drawImage(
        hearingAidImg, 
        hearingAidX, 
        hearingAidY, 
        hearingAidWidth, 
        hearingAidHeight
      );
      
      // Restore context (undoing any rotation and flipping)
      ctx.restore();
      
      // Add product label (optional - can be removed for a cleaner look)
      // Only add label for non-close-up images for better aesthetics
      if (!isCloseup) {
        renderProductLabel(ctx, earPosition, hearingAid);
      }
    } else {
      // If no ear detected, show a clear error message on the image
      console.error('No ear detected in the image');
      
      // Draw error message with a nicer presentation
      const bgHeight = 80;
      const bgY = canvas.height / 2 - bgHeight / 2;
      
      // Semi-transparent background for better readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, bgY, canvas.width, bgHeight);
      
      // White text
      ctx.fillStyle = 'white';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Multi-line message for better clarity
      ctx.fillText(
        'No ear detected in this image.',
        canvas.width / 2,
        bgY + bgHeight / 2 - 15
      );
      
      ctx.font = '16px Arial';
      ctx.fillText(
        'Please try a photo where the ear is clearly visible.',
        canvas.width / 2,
        bgY + bgHeight / 2 + 15
      );
    }
  } catch (e) {
    console.error('Error applying 2D hearing aid image:', e);
    
    // If 2D image approach fails, just show the error
    // Draw error message with a nicer presentation
    const bgHeight = 80;
    const bgY = canvas.height / 2 - bgHeight / 2;
    
    // Semi-transparent background for better readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, bgY, canvas.width, bgHeight);
    
    // White text
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Multi-line message for better clarity
    ctx.fillText(
      'Unable to process this image.',
      canvas.width / 2,
      bgY + bgHeight / 2 - 15
    );
    
    ctx.font = '16px Arial';
    ctx.fillText(
      'Please try a different photo with better lighting.',
      canvas.width / 2,
      bgY + bgHeight / 2 + 15
    );
  }
  
  // Convert the processed canvas to data URL
  return canvas.toDataURL('image/jpeg', 0.95);
};

// Enhanced ear detection parameters
const EAR_DETECTION = {
  // Minimum ear width in pixels
  MIN_WIDTH: 40,
  
  // Color ranges for skin detection (different ranges for different skin tones)
  COLOR_RANGES: [
    // Lighter skin tones
    {
      rMin: 180, rMax: 255,
      gMin: 130, gMax: 220,
      bMin: 100, bMax: 200
    },
    // Medium skin tones
    {
      rMin: 120, rMax: 220,
      gMin: 70, gMax: 170,
      bMin: 45, bMax: 150
    },
    // Darker skin tones
    {
      rMin: 60, rMax: 160,
      gMin: 40, gMax: 120,
      bMin: 25, bMax: 100
    },
    // Additional lighter skin tones
    {
      rMin: 200, rMax: 255,
      gMin: 150, gMax: 255,
      bMin: 120, bMax: 255
    },
    // Additional medium tones
    {
      rMin: 140, rMax: 200,
      gMin: 85, gMax: 160,
      bMin: 60, bMax: 140
    },
    // Additional darker tones
    {
      rMin: 40, rMax: 120,
      gMin: 30, gMax: 100,
      bMin: 20, bMax: 80
    }
  ],
  
  // Edge detection threshold
  EDGE_THRESHOLD: 20,
  
  // Number of minimum ear pixels required
  MIN_EAR_PIXELS: 100,
  
  // Skin pixel ratio thresholds (adjusted to be more permissive)
  MIN_SKIN_RATIO: 0.01,
  MAX_SKIN_RATIO: 0.98 // Increased from 0.8 to handle skin-dominant images
};

// Helper function to detect if a pixel might be part of an ear
const isEarPixel = (r: number, g: number, b: number): boolean => {
  return EAR_DETECTION.COLOR_RANGES.some(range => {
    return r >= range.rMin && r <= range.rMax &&
           g >= range.gMin && g <= range.gMax &&
           b >= range.bMin && b <= range.bMax;
  });
};

// Interface for ear detection result
interface EarPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isRightEar: boolean;
}

// Function to detect ear position in an image
const detectEarPosition = (imageData: ImageData): EarPosition | null => {
  const { data, width, height } = imageData;
  
  // Skip processing for tiny images
  if (width < 100 || height < 100) {
    console.log('Image too small for ear detection');
    return null; // Return null instead of fallback position
  }
  
  // Enhanced detection for close-up ear images (like the one shared by the user)
  const isCentralEarCanal = isCentralDarkSpot(imageData);
  
  if (isCentralEarCanal) {
    console.log('Detected close-up ear with central ear canal');
    
    // For close-up images, we need to determine if this is a left or right ear
    // Analyze the skin distribution to make a better guess
    const skinDistribution = analyzeEarSides(imageData);
    
    return createCloseUpEarPosition(width, height, skinDistribution.isRightEar);
  }
  
  // Regular detection logic for non-close-up images
  const earPixels: { x: number, y: number }[] = [];
  let skinPixelCount = 0;
  let totalPixels = width * height;
  
  // First pass: collect potential ear pixels by color
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      if (isEarPixel(r, g, b)) {
        earPixels.push({ x, y });
        skinPixelCount++;
      }
    }
  }
  
  // If skin ratio is very low or very high, probably not a valid ear image
  const skinPixelRatio = skinPixelCount / totalPixels;
  console.log(`Detected skin pixel ratio: ${skinPixelRatio.toFixed(2)}`);
  
  if (skinPixelRatio < EAR_DETECTION.MIN_SKIN_RATIO || skinPixelRatio > EAR_DETECTION.MAX_SKIN_RATIO) {
    console.log(`Skin pixel ratio ${skinPixelRatio.toFixed(2)} outside expected range, can't detect ear`);
    return null; // Return null instead of fallback position
  }
  
  if (earPixels.length < EAR_DETECTION.MIN_EAR_PIXELS) {
    console.log('Not enough ear pixels detected');
    return null; // Return null instead of fallback position
  }
  
  // Determine skin region position (right side or left side of image)
  let leftCount = 0;
  let rightCount = 0;
  const midX = width / 2;
  
  earPixels.forEach(pixel => {
    if (pixel.x < midX) leftCount++;
    else rightCount++;
  });
  
  // Assume the side with more skin pixels is the side with the ear
  const isRightEar = leftCount > rightCount;
  
  // Calculate bounds of ear pixels focused on the appropriate side
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  
  // Filter pixels to the side where we expect the ear to be
  // For high skin ratio images, use a more restrictive side filter
  const sideThreshold = skinPixelRatio > 0.7 ? width * 0.3 : midX;
  const relevantPixels = earPixels.filter(pixel => 
    isRightEar ? pixel.x < sideThreshold : pixel.x > (width - sideThreshold)
  );
  
  // If there aren't enough relevant pixels, use all pixels
  const pixelsToUse = relevantPixels.length > EAR_DETECTION.MIN_EAR_PIXELS 
    ? relevantPixels 
    : earPixels;
  
  pixelsToUse.forEach(pixel => {
    minX = Math.min(minX, pixel.x);
    minY = Math.min(minY, pixel.y);
    maxX = Math.max(maxX, pixel.x);
    maxY = Math.max(maxY, pixel.y);
  });
  
  const earWidth = maxX - minX;
  const earHeight = maxY - minY;
  
  // Basic validation of ear dimensions
  if (earWidth < EAR_DETECTION.MIN_WIDTH || earHeight < earWidth * 0.5) {
    console.log('Ear dimensions validation failed');
    return null; // Return null instead of fallback position
  }
  
  // Calculate the ear center
  const centerX = minX + earWidth / 2;
  const centerY = minY + earHeight / 2;
  
  // Determine rotation (minimal rotation for 2D overlay approach)
  const rotation = 0;
  
  // Adjust positioning for hearing aid placement
  const adjustedX = isRightEar
    ? minX + earWidth * 0.2  // For right ear, position near left edge
    : minX + earWidth * 0.8; // For left ear, position near right edge
  
  const adjustedY = minY + earHeight * 0.35; // Position in upper third of ear area
  
  console.log(`Detected ${isRightEar ? 'right' : 'left'} ear at: (${adjustedX.toFixed(0)}, ${adjustedY.toFixed(0)})`);
  
  return {
    x: adjustedX,
    y: adjustedY,
    width: earWidth,
    height: earHeight,
    rotation: rotation,
    isRightEar: isRightEar
  };
};

// Analyze both sides of an image to determine if it's a left or right ear
const analyzeEarSides = (imageData: ImageData): { isRightEar: boolean } => {
  const { data, width, height } = imageData;
  
  // Split the image into left and right halves
  const leftHalf: number[] = [];
  const rightHalf: number[] = [];
  
  const midX = Math.floor(width / 2);
  
  // For close-up ear images, the lighter area is typically the outside of the ear
  // and the darker area is typically where the ear connects to the head
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Calculate the brightness
      const brightness = (r + g + b) / 3;
      
      if (x < midX) {
        leftHalf.push(brightness);
      } else {
        rightHalf.push(brightness);
      }
    }
  }
  
  // Calculate average brightness for each half
  const leftAvg = leftHalf.reduce((sum, val) => sum + val, 0) / leftHalf.length;
  const rightAvg = rightHalf.reduce((sum, val) => sum + val, 0) / rightHalf.length;
  
  console.log(`Left half avg brightness: ${leftAvg.toFixed(2)}, Right half: ${rightAvg.toFixed(2)}`);
  
  // For a right ear, the right side of the image is typically brighter
  // For a left ear, the left side of the image is typically brighter
  const isRightEar = rightAvg > leftAvg;
  
  console.log(`Based on brightness analysis, detected a ${isRightEar ? 'right' : 'left'} ear`);
  
  return { isRightEar };
};

// Check if image has a central dark spot (ear canal in close-up images)
const isCentralDarkSpot = (imageData: ImageData): boolean => {
  const { data, width, height } = imageData;
  
  // Define central region to check (middle 1/4 of the image)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const checkRadius = Math.min(width, height) / 8;
  const checkRadiusSquared = checkRadius * checkRadius;
  
  // Look for dark spot in the center region
  let darkPixelCount = 0;
  let totalCheckedPixels = 0;
  
  // Also check for skin-colored pixels around the dark spot
  let skinPixelCount = 0;
  
  // Check square region for simplicity
  for (let y = centerY - checkRadius; y < centerY + checkRadius; y++) {
    if (y < 0 || y >= height) continue;
    
    for (let x = centerX - checkRadius; x < centerX + checkRadius; x++) {
      if (x < 0 || x >= width) continue;
      
      // Check if this pixel is within the circular region
      const distSquared = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
      if (distSquared > checkRadiusSquared) continue;
      
      totalCheckedPixels++;
      
      // Get pixel data
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Define what we consider a "dark" pixel (ear canal is typically dark)
      const brightness = (r + g + b) / 3;
      if (brightness < 80) { // Increased threshold to catch more ear canals
        darkPixelCount++;
      }
      
      // Check if this is a skin-colored pixel
      if (isEarPixel(r, g, b)) {
        skinPixelCount++;
      }
    }
  }
  
  // Calculate ratios
  const darkRatio = darkPixelCount / totalCheckedPixels;
  const skinRatio = skinPixelCount / totalCheckedPixels;
  
  console.log(`Dark pixel ratio in center: ${darkRatio.toFixed(3)}, Skin pixel ratio: ${skinRatio.toFixed(3)}`);
  
  // For an ear canal, we need both a dark spot and surrounding skin
  return darkRatio > 0.03 && skinRatio > 0.3;
};

// Create position for close-up ear image with improved positioning
const createCloseUpEarPosition = (width: number, height: number, isRightEar: boolean): EarPosition => {
  // For close-up ears, we know the ear is covering most of the image
  
  // For a close-up ear, the hearing aid needs to be positioned carefully
  const earWidth = width / 5;  // Smaller hearing aid for close-up
  const earHeight = height / 4;
  
  let xPosition;
  
  // Position the hearing aid behind the ear
  if (isRightEar) {
    // For right ear: position on right side, behind the ear
    xPosition = width * 0.75;
  } else {
    // For left ear: position on left side, behind the ear
    xPosition = width * 0.25;
  }
  
  // Vertically, position slightly above the middle
  const yPosition = height * 0.42;
  
  console.log(`Using close-up ear position for ${isRightEar ? 'right' : 'left'} ear at (${xPosition.toFixed(0)}, ${yPosition.toFixed(0)})`);
  
  return {
    x: xPosition,
    y: yPosition,
    width: earWidth,
    height: earHeight,
    rotation: 0,
    isRightEar: isRightEar
  };
};

// Render the 3D model of a hearing aid
const renderHearingAid3D = async (
  ctx: CanvasRenderingContext2D,
  model: THREE.Group,
  earPosition: EarPosition,
  productId: string
): Promise<void> => {
  try {
    // First try to use product image for more accurate rendering
    const hearingAidImagePath = getHearingAidImagePath(productId);
    const hearingAidImg = await loadImage(hearingAidImagePath);
    
    // If image loaded successfully, use 2D rendering method
    const hearingAidWidth = earPosition.width * 1.2;
    const hearingAidHeight = hearingAidWidth * (hearingAidImg.height / hearingAidImg.width);
    
    // Position the hearing aid at the ear
    const hearingAidX = earPosition.isRightEar 
      ? earPosition.x - hearingAidWidth * 0.8
      : earPosition.x + earPosition.width * 0.3;
    
    const hearingAidY = earPosition.y - hearingAidHeight * 0.3;
    
    // Save context for transformations
    ctx.save();
    
    // Apply any rotation needed
    if (earPosition.rotation !== 0) {
      const centerX = hearingAidX + hearingAidWidth / 2;
      const centerY = hearingAidY + hearingAidHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(earPosition.rotation);
      ctx.translate(-centerX, -centerY);
    }
    
    // For right ear, we need to flip the image horizontally
    if (earPosition.isRightEar) {
      ctx.scale(-1, 1);
      ctx.translate(-2 * hearingAidX - hearingAidWidth, 0);
    }
    
    // Draw the hearing aid image
    ctx.drawImage(
      hearingAidImg, 
      hearingAidX, 
      hearingAidY, 
      hearingAidWidth, 
      hearingAidHeight
    );
    
    // Restore context
    ctx.restore();
    
  } catch (error) {
    console.error('Failed to use product image for 3D fallback, using generic 3D model:', error);
    
    // Fall back to generic 3D model with default color
    const colorHex = '#A0A0A0'; // Default grey color
    
    // Create an offscreen canvas for 3D rendering
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 256;
    offscreenCanvas.height = 256;
    
    // Set up Three.js renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: offscreenCanvas,
      alpha: true
    });
    renderer.setClearColor(0x000000, 0);
    
    // Set up scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Clone the model
    const modelClone = model.clone();
    
    // Apply color to model material
    modelClone.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(material => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.color.set(colorHex);
            }
          });
        }
      }
    });
    
    // Apply rotation to match ear orientation
    // Flip the model horizontally based on which ear we're rendering for
    modelClone.rotation.y = earPosition.isRightEar ? -Math.PI / 2 : Math.PI / 2;
    modelClone.rotation.x = earPosition.rotation;
    
    // Apply scale
    const hearingAidScale = earPosition.width / 180;
    const scaleFactor = 0.8 * hearingAidScale;
    modelClone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    scene.add(modelClone);
    
    // Render the model
    renderer.render(scene, camera);
    
    // Calculate position to draw the rendered model
    const hearingAidX = earPosition.x;
    const hearingAidY = earPosition.y;
    
    // Draw the rendered model onto the main canvas
    ctx.drawImage(
      offscreenCanvas, 
      0, 0, 256, 256,
      hearingAidX - 128 * hearingAidScale, 
      hearingAidY - 128 * hearingAidScale,
      256 * hearingAidScale, 
      256 * hearingAidScale
    );
    
    // Clean up
    scene.remove(modelClone);
    renderer.dispose();
  }
};

// Render a 2D hearing aid
const renderHearingAid2D = async (
  ctx: CanvasRenderingContext2D,
  earPosition: EarPosition,
  hearingAid: HearingAid,
  hearingAidX: number,
  hearingAidY: number,
  hearingAidScale: number,
  productId: string
): Promise<void> => {
  try {
    // Try to load the product-specific image
    const hearingAidImagePath = getHearingAidImagePath(productId);
    const hearingAidImg = await loadImage(hearingAidImagePath);
    
    // Calculate dimensions
    const hearingAidWidth = earPosition.width * hearingAidScale * 5; // Scale up from the base scale
    const hearingAidHeight = hearingAidWidth * (hearingAidImg.height / hearingAidImg.width);
    
    // Save context for transformations
    ctx.save();
    
    // Position and apply rotation
    ctx.translate(hearingAidX, hearingAidY);
    ctx.rotate(earPosition.rotation);
    
    // For right ear, flip the image horizontally
    if (earPosition.isRightEar) {
      ctx.scale(-1, 1);
    }
    
    // Draw the image
    ctx.drawImage(
      hearingAidImg,
      -hearingAidWidth / 2,
      -hearingAidHeight / 2,
      hearingAidWidth,
      hearingAidHeight
    );
    
    // Restore context
    ctx.restore();
  } catch (error) {
    console.error('Failed to load product image for 2D rendering, using fallback drawing:', error);
    
    // Fall back to basic drawing if image fails to load
    const color = hearingAid.colors && hearingAid.colors.length > 0 
      ? hearingAid.colors[0] 
      : '#A0A0A0';
    
    const bodyWidth = hearingAidScale * 25;
    const bodyHeight = hearingAidScale * 40;
    
    // Save current context state
    ctx.save();
    
    // Move to hearing aid position and apply rotation
    ctx.translate(hearingAidX, hearingAidY);
    ctx.rotate(earPosition.rotation);
    
    // Draw hearing aid body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyWidth, bodyHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw hearing aid details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-bodyWidth * 0.2, -bodyHeight * 0.2, bodyWidth * 0.4, bodyHeight * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw hearing aid tube - direction depends on which ear
    const tubeDirection = earPosition.isRightEar ? -1 : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = bodyWidth * 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, bodyHeight * 0.5);
    ctx.bezierCurveTo(
      bodyWidth * 0.5 * tubeDirection, bodyHeight * 0.7,
      bodyWidth * 0.8 * tubeDirection, bodyHeight * 0.9,
      bodyWidth * tubeDirection, bodyHeight
    );
    ctx.stroke();
    
    // Add highlight to make it look more 3D
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-bodyWidth * 0.3, -bodyHeight * 0.3, bodyWidth * 0.2, bodyHeight * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Restore context
    ctx.restore();
  }
};

// Render product label
const renderProductLabel = (
  ctx: CanvasRenderingContext2D,
  earPosition: EarPosition,
  hearingAid: HearingAid
): void => {
  const labelWidth = earPosition.width;
  const labelHeight = 30;
  const labelX = earPosition.x - labelWidth / 2;
  const labelY = earPosition.y + earPosition.height + 10;
  
  // Draw label background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  
  // Draw product name
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    hearingAid.name, 
    labelX + labelWidth / 2, 
    labelY + labelHeight / 2
  );
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

/**
 * Render AR overlay directly onto a canvas from image data
 * This function is used for real-time camera feed processing 
 */
export const renderAROverlay = async (
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  hearingAid: HearingAid,
  facingMode: 'user' | 'environment' = 'environment'
): Promise<void> => {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw original image data
    ctx.putImageData(imageData, 0, 0);
    
    // Detect ear position - can return null if no ear detected
    const earPosition = detectEarPosition(imageData);
    
    // For mobile view, only render when we have a valid ear position
    // This prevents flickering when no ear is detected
    if (earPosition) {
      // Determine if we should flip the ear detection based on camera facing mode
      // 'user' is front-facing camera (mirror image), 'environment' is back camera
      const isRightEar = facingMode === 'user' ? !earPosition.isRightEar : earPosition.isRightEar;
      
      // Update ear position with correct left/right detection
      earPosition.isRightEar = isRightEar;
      
      try {
        // Get product-specific hearing aid image path
        const hearingAidImagePath = getHearingAidImagePath(hearingAid.id);
        const hearingAidImg = await loadImage(hearingAidImagePath);
        
        // Calculate size for hearing aid image - adjust based on ear size
        // Make the hearing aid much smaller, especially for mobile
        const isMobile = window.innerWidth < 768;
        const scaleFactorWidth = isMobile ? 
          Math.max(0.6, Math.min(0.8, canvas.width / 800)) : // Smaller on mobile
          Math.max(0.8, Math.min(1.2, canvas.width / 600));  // Slightly larger on desktop
          
        const hearingAidWidth = earPosition.width * scaleFactorWidth;
        const hearingAidHeight = hearingAidWidth * (hearingAidImg.height / hearingAidImg.width);
        
        // Position the hearing aid behind the ear (only a little bit visible)
        // Adjust the offset to be more subtle
        const positionOffsetX = earPosition.isRightEar ? 
          0.6 :  // For right ear, position mostly behind the ear
          -0.1;  // For left ear, position mostly behind the ear
          
        const hearingAidX = earPosition.isRightEar 
          ? earPosition.x + (earPosition.width * positionOffsetX)
          : earPosition.x + (earPosition.width * positionOffsetX);
        
        // Position at ear level, slightly above the center
        const hearingAidY = earPosition.y - (hearingAidHeight * 0.2);
        
        // Save context for rotation
        ctx.save();
        
        // Apply rotation if needed
        if (earPosition.rotation !== 0) {
          const centerX = hearingAidX + hearingAidWidth / 2;
          const centerY = hearingAidY + hearingAidHeight / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate(earPosition.rotation);
          ctx.translate(-centerX, -centerY);
        }
        
        // For right ear, we need to flip the image horizontally
        if (earPosition.isRightEar) {
          ctx.scale(-1, 1);
          ctx.translate(-2 * hearingAidX - hearingAidWidth, 0);
        }
        
        // Draw hearing aid image
        ctx.drawImage(
          hearingAidImg, 
          hearingAidX, 
          hearingAidY, 
          hearingAidWidth, 
          hearingAidHeight
        );
        
        // Restore context
        ctx.restore();
        
        // Add product label - make it conditional and smaller for mobile
        if (!isMobile) {
          renderProductLabel(ctx, earPosition, hearingAid);
        }
      } catch (error) {
        console.error('Error rendering hearing aid image:', error);
        
        // Only use fallback if we have a valid ear position
        // But don't try to render anything if image loading failed
        // This prevents confusing incorrect renderings
      }
    } else {
      // If no ear position detected, display a clear guidance message
      const isMobile = window.innerWidth < 768;
      
      // Semi-transparent black background for better readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
      
      // White text
      ctx.fillStyle = 'white';
      ctx.font = isMobile ? '14px Arial' : '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(
        'Position your ear in frame to see the hearing aid',
        canvas.width / 2,
        canvas.height - 25
      );
    }
  } catch (error) {
    console.error('Error in renderAROverlay:', error);
    // Log error but don't rethrow to keep video processing going
  }
}; 