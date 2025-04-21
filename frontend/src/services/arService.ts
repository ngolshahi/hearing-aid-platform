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
  try {
    if (modelCache['hearing-aid']) {
      console.log('Using cached 3D model');
      return modelCache['hearing-aid'];
    }

    console.log('Loading 3D model from: /models/hearing-aid-model.glb');
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load('/models/hearing-aid-model.glb', (gltf: any) => {
        console.log('3D model loaded successfully');
        const model = gltf.scene;
        // Cache the model
        modelCache['hearing-aid'] = model;
        resolve(model);
      }, 
      (progress) => {
        console.log(`Loading 3D model: ${Math.round(progress.loaded / progress.total * 100)}%`);
      }, 
      (error: any) => {
        console.error('Error loading hearing aid model:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Exception loading 3D model:', error);
    throw error;
  }
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

// Enhanced ear detection parameters
const EAR_DETECTION = {
  // Anatomical ear parts for RIC hearing aid positioning
  PARTS: {
    CANAL: 'canal',     // Where the receiver goes
    HELIX: 'helix',     // Top curve of ear where wire bends over
    BEHIND_EAR: 'behindEar'  // Where the main body sits
  },
  
  // Color ranges for skin detection
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
  
  // Minimum ear detection parameters
  MIN_WIDTH: 40,
  MIN_EAR_PIXELS: 100,
  MIN_SKIN_RATIO: 0.01,
  MAX_SKIN_RATIO: 0.98
};

// Helper function to detect if a pixel might be part of an ear
const isEarPixel = (r: number, g: number, b: number): boolean => {
  return EAR_DETECTION.COLOR_RANGES.some(range => {
    return r >= range.rMin && r <= range.rMax &&
           g >= range.gMin && g <= range.gMax &&
           b >= range.bMin && b <= range.bMax;
  });
};

// Enhanced ear position interface to include key anatomical points
interface EarPosition {
  // Main ear position
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isRightEar: boolean;
  
  // Anatomical points for RIC hearing aid
  canalPosition?: {x: number, y: number};  // For receiver placement
  helixPosition?: {x: number, y: number};  // For wire bend
  behindEarPosition?: {x: number, y: number}; // For main device body
}

// Function to detect ear position with anatomical points for RIC hearing aid
const detectEarPosition = (imageData: ImageData): EarPosition | null => {
  const { data, width, height } = imageData;
  const isMobile = window.innerWidth < 768;
  
  // Skip processing for tiny images
  if (width < 100 || height < 100) {
    console.log('Image too small for ear detection');
    return null;
  }

  // For desktop uploads, the ear is typically centered
  if (!isMobile) {
    console.log('Desktop upload detected, using fixed ear position');
    
    // For desktop uploads, assume ear is centered in the image
    // and is a left ear (hearing aid should go on right side of ear)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // Use fixed ear dimensions based on image size
    const earWidth = width / 3;
    const earHeight = height / 2;
    
    // Calculate anatomical points based on center position
    const canalX = centerX + earWidth * 0.2; // Canal on the right side of center for left ear
    const canalY = centerY + earHeight * 0.1; // Slightly below center
    
    // Helix position (top curve of ear)
    const helixX = centerX; // Center horizontally  
    const helixY = centerY - earHeight * 0.3; // Above center
    
    // Behind ear position (where RIC body sits)
    const behindEarX = centerX + earWidth * 0.6; // Right of center for left ear
    const behindEarY = centerY - earHeight * 0.1; // Slightly above center
    
    console.log(`Using fixed left ear configuration for desktop with center at (${centerX}, ${centerY})`);
    
    return {
      x: centerX,
      y: centerY,
      width: earWidth,
      height: earHeight,
      rotation: 0,
      isRightEar: false, // Always treat as left ear for desktop
      canalPosition: { x: canalX, y: canalY },
      helixPosition: { x: helixX, y: helixY },
      behindEarPosition: { x: behindEarX, y: behindEarY }
    };
  }
  
  // For mobile (camera view), try detailed detection
  const isCloseUp = detectIfCloseupEar(imageData);
  
  if (isCloseUp) {
    return detectCloseUpEar(imageData);
  }
  
  // For regular mobile images, use standard detection
  return detectStandardEar(imageData);
};

// Check if image is a close-up of an ear
const detectIfCloseupEar = (imageData: ImageData): boolean => {
  const { data, width, height } = imageData;
  
  // Check for dark ear canal in center region
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const checkRadius = Math.min(width, height) / 8;
  
  let darkPixelCount = 0;
  let totalCheckedPixels = 0;
  let skinPixelCount = 0;
  
  // Search circular region for ear canal (dark spot)
  for (let y = centerY - checkRadius; y < centerY + checkRadius; y++) {
    if (y < 0 || y >= height) continue;
    
    for (let x = centerX - checkRadius; x < centerX + checkRadius; x++) {
      if (x < 0 || x >= width) continue;
      
      // Check if pixel is within circular region
      const distSquared = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
      if (distSquared > checkRadius * checkRadius) continue;
      
      totalCheckedPixels++;
      
      // Check pixel color
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Check for dark pixels (ear canal)
      const brightness = (r + g + b) / 3;
      if (brightness < 80) {
        darkPixelCount++;
      }
      
      // Check for skin pixels
      if (isEarPixel(r, g, b)) {
        skinPixelCount++;
      }
    }
  }
  
  // Calculate ratios
  const darkRatio = darkPixelCount / totalCheckedPixels;
  const skinRatio = skinPixelCount / totalCheckedPixels;
  
  console.log(`Dark pixel ratio: ${darkRatio.toFixed(3)}, Skin ratio: ${skinRatio.toFixed(3)}`);
  
  // Criteria for close-up ear with visible canal
  return darkRatio > 0.03 && skinRatio > 0.5;
};

// Detect ear position for close-up ear images
const detectCloseUpEar = (imageData: ImageData): EarPosition | null => {
  const { data, width, height } = imageData;
  
  console.log('Using close-up ear detection method');
  
  // Analyze image brightness to determine ear side
  const { isRightEar } = analyzeEarSides(imageData);
  
  // Find ear canal (darkest region near center)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const searchRadius = Math.min(width, height) / 5; // Increased radius
  
  // Locate the ear canal
  let canalX = centerX;
  let canalY = centerY;
  let minBrightness = 255;
  
  // Search for darkest point near center (ear canal)
  for (let y = centerY - searchRadius; y < centerY + searchRadius; y++) {
    if (y < 0 || y >= height) continue;
    
    for (let x = centerX - searchRadius; x < centerX + searchRadius; x++) {
      if (x < 0 || x >= width) continue;
      
      // Check if pixel is within search area
      const distSquared = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
      if (distSquared > searchRadius * searchRadius) continue;
      
      // Get pixel brightness
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;
      
      // Keep track of darkest point
      if (brightness < minBrightness) {
        minBrightness = brightness;
        canalX = x;
        canalY = y;
      }
    }
  }
  
  console.log(`Detected ear canal at (${canalX}, ${canalY}), brightness: ${minBrightness}`);
  
  // Estimate ear dimensions
  const earWidth = width / 2.2;  // Slightly larger
  const earHeight = height / 1.8; // Slightly larger
  
  // Determine helix position (top of ear) - improved for accuracy
  // For close-up images, estimate the helix position above and to the side of the canal
  const helixOffsetX = earWidth * (isRightEar ? -0.25 : 0.25);
  const helixOffsetY = -earHeight * 0.4; // Up from canal
  const helixX = canalX + helixOffsetX;
  const helixY = canalY + helixOffsetY;
  
  // Determine behind-ear position - improved for better hearing aid placement
  // This is where the main body of the RIC hearing aid sits
  const behindEarOffsetX = earWidth * (isRightEar ? -0.5 : 0.5); // Further out from ear
  const behindEarOffsetY = -earHeight * 0.15; // Slightly above canal level
  const behindEarX = canalX + behindEarOffsetX;
  const behindEarY = canalY + behindEarOffsetY;
  
  // Return ear position with anatomical points
  return {
    x: canalX,
    y: canalY,
    width: earWidth,
    height: earHeight,
    rotation: 0,
    isRightEar: isRightEar,
    canalPosition: { x: canalX, y: canalY },
    helixPosition: { x: helixX, y: helixY },
    behindEarPosition: { x: behindEarX, y: behindEarY }
  };
};

// Detect ear position for standard (non-close-up) ear images
const detectStandardEar = (imageData: ImageData): EarPosition | null => {
  const { data, width, height } = imageData;
  
  console.log('Using standard ear detection method');
  
  // Collect ear pixels based on skin color
  const earPixels: { x: number, y: number }[] = [];
  let skinPixelCount = 0;
  let totalPixels = width * height;
  
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
  
  // Check if we have enough skin pixels
  const skinPixelRatio = skinPixelCount / totalPixels;
  console.log(`Detected skin pixel ratio: ${skinPixelRatio.toFixed(2)}`);
  
  if (skinPixelRatio < EAR_DETECTION.MIN_SKIN_RATIO || 
      skinPixelRatio > EAR_DETECTION.MAX_SKIN_RATIO || 
      earPixels.length < EAR_DETECTION.MIN_EAR_PIXELS) {
    console.log('Insufficient ear pixels for detection');
    return null;
  }
  
  // Determine ear side
  let leftCount = 0;
  let rightCount = 0;
  const midX = width / 2;
  
  earPixels.forEach(pixel => {
    if (pixel.x < midX) leftCount++;
    else rightCount++;
  });
  
  const isRightEar = leftCount > rightCount;
  
  // Calculate ear bounds
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  
  // Focus on the side where the ear is
  const relevantPixels = earPixels.filter(pixel => 
    isRightEar ? pixel.x < midX : pixel.x >= midX
  );
  
  if (relevantPixels.length < EAR_DETECTION.MIN_EAR_PIXELS) {
    console.log('Not enough relevant ear pixels');
    return null;
  }
  
  relevantPixels.forEach(pixel => {
    minX = Math.min(minX, pixel.x);
    minY = Math.min(minY, pixel.y);
    maxX = Math.max(maxX, pixel.x);
    maxY = Math.max(maxY, pixel.y);
  });
  
  const earWidth = maxX - minX;
  const earHeight = maxY - minY;
  
  if (earWidth < EAR_DETECTION.MIN_WIDTH || earHeight < earWidth * 0.5) {
    console.log('Ear dimensions too small');
    return null;
  }
  
  // Calculate ear center
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Now let's try to find the ear canal
  // For standard images, estimate it on the side of the ear closest to the head
  const canalX = isRightEar ? 
    maxX - earWidth * 0.2 : // For right ear, canal on the right side of the ear region
    minX + earWidth * 0.2;  // For left ear, canal on the left side of the ear region
  const canalY = centerY + earHeight * 0.1; // Slightly below center
  
  // Estimate helix position (top curve of ear)
  const helixX = isRightEar ?
    centerX - earWidth * 0.1 : // For right ear, helix is left of center
    centerX + earWidth * 0.1;  // For left ear, helix is right of center
  const helixY = minY + earHeight * 0.2; // Near top of ear
  
  // Estimate behind-ear position (where RIC body sits)
  const behindEarX = isRightEar ?
    minX - earWidth * 0.3 : // For right ear, behind is to the left
    maxX + earWidth * 0.3;  // For left ear, behind is to the right
  const behindEarY = helixY; // Same vertical position as helix
  
  console.log(`Detected ${isRightEar ? 'right' : 'left'} ear with canal at (${canalX.toFixed(0)}, ${canalY.toFixed(0)})`);
  
  return {
    x: centerX,
    y: centerY,
    width: earWidth,
    height: earHeight,
    rotation: 0,
    isRightEar: isRightEar,
    canalPosition: { x: canalX, y: canalY },
    helixPosition: { x: helixX, y: helixY },
    behindEarPosition: { x: behindEarX, y: behindEarY }
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
  const isMobile = window.innerWidth < 768;
  const labelWidth = isMobile ? window.innerWidth * 0.8 : earPosition.width * 1.5;
  const labelHeight = 40;
  
  // Position at bottom of screen for mobile, near ear for desktop
  const labelX = isMobile ? 
    (window.innerWidth - labelWidth) / 2 : 
    earPosition.x - labelWidth / 2;
    
  const labelY = isMobile ? 
    window.innerHeight - labelHeight - 20 : 
    earPosition.y + earPosition.height + 20;
  
  // Draw label background with rounded corners for better look
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 8);
  ctx.fill();
  
  // Draw product name
  ctx.fillStyle = 'white';
  ctx.font = isMobile ? '14px Arial' : '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    hearingAid.name, 
    labelX + labelWidth / 2, 
    labelY + labelHeight / 2 - (isMobile ? 7 : 8)
  );
  
  // Add "RIC Hearing Aid" text below product name
  ctx.font = isMobile ? '12px Arial' : '14px Arial';
  ctx.fillText(
    'RIC Hearing Aid',
    labelX + labelWidth / 2,
    labelY + labelHeight / 2 + (isMobile ? 7 : 8)
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
 * Now focused specifically on RIC hearing aids
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
    
    // Only proceed if this is a RIC type hearing aid
    if (!isRICHearingAid(hearingAid)) {
      showUnsupportedMessage(ctx, canvas, "This feature only works with RIC hearing aids");
      return;
    }
    
    // Detect ear position - can return null if no ear detected
    const earPosition = detectEarPosition(imageData);
    
    // Only render when we have a valid ear position
    if (earPosition) {
      // Adjust for camera facing mode (mirroring)
      const isRightEar = facingMode === 'user' ? !earPosition.isRightEar : earPosition.isRightEar;
      earPosition.isRightEar = isRightEar;
      
      try {
        // Get product-specific hearing aid image path
        const hearingAidImagePath = getHearingAidImagePath(hearingAid.id);
        const hearingAidImg = await loadImage(hearingAidImagePath);
        
        // Draw RIC hearing aid with proper placement
        await drawRICHearingAid(ctx, earPosition, hearingAidImg, hearingAid);
      } catch (error) {
        console.error('Error rendering RIC hearing aid:', error);
      }
    } else {
      // If no ear detected, show guidance message
      showNoEarDetectedMessage(ctx, canvas);
    }
  } catch (error) {
    console.error('Error in renderAROverlay:', error);
  }
};

// Check if hearing aid is an RIC type
const isRICHearingAid = (hearingAid: HearingAid): boolean => {
  const type = hearingAid.type.toUpperCase();
  return type.includes('RIC') || type.includes('RECEIVER');
};

// Show message when ear is not detected
const showNoEarDetectedMessage = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const isMobile = window.innerWidth < 768;
  
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = isMobile ? '14px Arial' : '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText(
    'Position your ear in frame to try on the hearing aid',
    canvas.width / 2,
    canvas.height - 25
  );
};

// Show message for unsupported hearing aid types
const showUnsupportedMessage = (
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement,
  message: string
): void => {
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText(
    message,
    canvas.width / 2,
    canvas.height - 25
  );
};

// Draw a RIC hearing aid with proper anatomical placement
const drawRICHearingAid = async (
  ctx: CanvasRenderingContext2D,
  earPosition: EarPosition,
  hearingAidImg: HTMLImageElement,
  hearingAid: HearingAid
): Promise<void> => {
  try {
    // Check if the model file exists first
    const modelExists = await checkModelFileExists();
    
    if (!modelExists) {
      console.log('3D model file not found, using 2D image instead');
      renderRIC2DImage(ctx, earPosition, hearingAidImg, hearingAid);
      return;
    }
    
    // Try to load and use the 3D model which already includes wire and receiver
    try {
      const model = await loadModel();
      await renderRIC3DModel(ctx, model, earPosition, hearingAid);
    } catch (error) {
      console.error('Error using 3D model, falling back to 2D image:', error);
      // Fall back to 2D image if 3D model fails
      renderRIC2DImage(ctx, earPosition, hearingAidImg, hearingAid);
    }
  } catch (error) {
    console.error('Error in drawRICHearingAid:', error);
    
    // Last resort fallback - simple colored box to verify position
    try {
      if (earPosition.behindEarPosition) {
        const { x, y } = earPosition.behindEarPosition;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(x - 30, y - 30, 60, 60);
        console.log('Drew emergency fallback indicator at', x, y);
      }
    } catch (e) {
      console.error('Even emergency fallback failed:', e);
    }
  }
};

// Render RIC hearing aid using 3D model
const renderRIC3DModel = async (
  ctx: CanvasRenderingContext2D,
  model: THREE.Group,
  earPosition: EarPosition,
  hearingAid: HearingAid
): Promise<void> => {
  try {
    console.log('Rendering RIC with 3D model for ear position:', earPosition);
    
    // Get the dimensions of the canvas
    const canvas = ctx.canvas;
    const { width, height } = canvas;
    
    // IMPORTANT: Always treat as left ear for desktop uploads
    // This ensures consistent positioning regardless of detection
    const isMobile = window.innerWidth < 768;
    const forceLeftEar = !isMobile; // Force left ear for desktop
    
    // Override ear side detection for desktop
    if (forceLeftEar) {
      console.log('Forcing left ear configuration for desktop');
      earPosition.isRightEar = false;
    }
    
    // Make sure we have all the necessary positions or create them if missing
    if (!earPosition.canalPosition || !earPosition.helixPosition || !earPosition.behindEarPosition) {
      console.log('Computing anatomical points from ear center');
      
      // Calculate anatomical points relative to ear center if missing
      const earWidth = earPosition.width;
      const earHeight = earPosition.height;
      
      earPosition.canalPosition = {
        x: earPosition.x + (earPosition.isRightEar ? -earWidth * 0.2 : earWidth * 0.2),
        y: earPosition.y + earHeight * 0.1
      };
      
      earPosition.helixPosition = {
        x: earPosition.x,
        y: earPosition.y - earHeight * 0.3
      };
      
      earPosition.behindEarPosition = {
        x: earPosition.x + (earPosition.isRightEar ? -earWidth * 0.6 : earWidth * 0.6),
        y: earPosition.y - earHeight * 0.1
      };
    }
    
    // Create an offscreen canvas for 3D rendering
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = 1024; // Increased resolution
    offscreenCanvas.height = 1024; // Increased resolution
    
    // Set up Three.js renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: offscreenCanvas,
      alpha: true,
      antialias: true // Added antialiasing for better quality
    });
    renderer.setClearColor(0x000000, 0);
    
    // Set up scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5;
    
    // Add lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add a second light from another angle
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-1, 0.5, 0.5);
    scene.add(directionalLight2);
    
    // Clone the model
    const modelClone = model.clone();
    console.log('Model cloned successfully');
    
    // Apply color to model material if hearing aid has colors
    if (hearingAid.colors && hearingAid.colors.length > 0) {
      const colorHex = hearingAid.colors[0];
      console.log(`Applying color ${colorHex} to model`);
      modelClone.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach(material => {
              if (material instanceof THREE.MeshStandardMaterial) {
                material.color.set(colorHex);
                // Enhance material properties for better visibility
                material.metalness = 0.3;
                material.roughness = 0.4;
                material.emissive.set(colorHex);
                material.emissiveIntensity = 0.2;
              }
            });
          }
        }
      });
    }
    
    // Calculate appropriate scale based on ear dimensions
    const isCloseUp = earPosition.width > width / 3;
    
    // Significantly increase scale for better visibility
    const desktopScaleFactor = isCloseUp ? 2.2 : 2.5;
    const mobileScaleFactor = isCloseUp ? 2.0 : 2.2;
    
    // Apply different scaling for desktop and mobile
    const scaleFactor = isMobile ? mobileScaleFactor : desktopScaleFactor;
    const modelScale = earPosition.width / 180 * scaleFactor;
    
    console.log(`Using model scale: ${modelScale}`);
    
    // Apply scale
    modelClone.scale.set(modelScale, modelScale, modelScale);
    
    // Apply rotation to match ear orientation
    // Fixed rotation values based on ear side and platform
    const rotationY = earPosition.isRightEar ? -Math.PI / 2 : Math.PI / 2;
    const rotationX = Math.PI * 0.05; // Slight downward tilt
    // Tilt model slightly toward face - more for desktop, less for mobile
    const rotationZ = earPosition.isRightEar ? 
      (isMobile ? -Math.PI * 0.08 : -Math.PI * 0.12) : 
      (isMobile ? Math.PI * 0.08 : Math.PI * 0.12);
    
    modelClone.rotation.set(rotationX, rotationY, rotationZ);
    
    // Add model to scene
    scene.add(modelClone);
    
    // Render the model
    renderer.render(scene, camera);
    console.log('3D model rendered to offscreen canvas');
    
    // FIXED POSITIONING LOGIC
    // Use precise positioning based on platform and whether it's a close-up
    let hearingAidX, hearingAidY;
    
    if (isMobile) {
      // MOBILE POSITIONING
      // Position the hearing aid relative to the ear canal
      const canalX = earPosition.canalPosition.x;
      const canalY = earPosition.canalPosition.y;
      
      if (earPosition.isRightEar) {
        // Right ear - position body behind ear
        hearingAidX = canalX - earPosition.width * 0.4;
      } else {
        // Left ear - position body behind ear
        hearingAidX = canalX + earPosition.width * 0.4;
      }
      // Position slightly above canal level
      hearingAidY = canalY - earPosition.height * 0.1;
      
    } else {
      // DESKTOP POSITIONING 
      // For desktop uploads, position consistently for left ear
      // Position the hearing aid body behind the ear, with receiver extending to canal
      const canalX = earPosition.canalPosition.x;
      const canalY = earPosition.canalPosition.y;
      
      // Add offset to ensure receiver aligns with ear canal
      hearingAidX = canalX + earPosition.width * 0.4; // Move right from canal for left ear
      hearingAidY = canalY - earPosition.height * 0.05; // Slightly above canal
    }
    
    console.log(`Drawing at position: (${hearingAidX}, ${hearingAidY})`);
    
    // Increase the render size for better visibility
    const renderSize = 1024 * modelScale * 1.2;
    
    // First, draw a subtle highlight for contrast
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(hearingAidX, hearingAidY, renderSize / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the model
    ctx.drawImage(
      offscreenCanvas, 
      0, 0, 1024, 1024,
      hearingAidX - renderSize / 2, 
      hearingAidY - renderSize / 2,
      renderSize, 
      renderSize
    );
    
    // Clean up
    scene.remove(modelClone);
    renderer.dispose();
    
    // Add product label only for desktop
    if (!isMobile) {
      // Semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, height - 40, width, 40);
      
      // Text
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(
        `${hearingAid.name} - RIC Hearing Aid`,
        width / 2,
        height - 20
      );
    }
    
    console.log('Completed 3D model rendering');
  } catch (error) {
    console.error('Error in renderRIC3DModel:', error);
    throw error;
  }
};

// Render RIC hearing aid using 2D image (fallback)
const renderRIC2DImage = (
  ctx: CanvasRenderingContext2D,
  earPosition: EarPosition,
  hearingAidImg: HTMLImageElement,
  hearingAid: HearingAid
): void => {
  try {
    console.log('Rendering RIC with 2D image for ear position:', earPosition);
    
    // Get the dimensions of the canvas
    const canvas = ctx.canvas;
    const { width, height } = canvas;
    
    // Calculate size based on ear dimensions
    const isMobile = window.innerWidth < 768;
    const isCloseUp = earPosition.width > width / 3;
    
    // Scale factor for 2D image - increase for better visibility
    const scaleFactor = isMobile ? 
      (isCloseUp ? 1.2 : 1.5) : // Mobile scaling (larger)
      (isCloseUp ? 1.4 : 1.8);  // Desktop scaling (larger)
    
    const ricBodyWidth = earPosition.width * scaleFactor;
    const ricBodyHeight = ricBodyWidth * (hearingAidImg.height / hearingAidImg.width);
    
    console.log(`Using image size: ${ricBodyWidth}x${ricBodyHeight}`);
    
    // Make sure we have behind-ear position
    if (!earPosition.behindEarPosition) {
      console.error('Missing behind-ear position for RIC placement');
      return;
    }
    
    // Save context for transformations
    ctx.save();
    
    // Position to draw the main body of the RIC behind the ear
    const bodyX = earPosition.behindEarPosition.x;
    const bodyY = earPosition.behindEarPosition.y;
    
    console.log(`Drawing at position: (${bodyX}, ${bodyY})`);
    
    // For right ear, flip the image horizontally
    if (earPosition.isRightEar) {
      ctx.scale(-1, 1);
      ctx.translate(-2 * bodyX, 0);
    }
    
    // Draw a background dot to verify position (for debugging)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(bodyX, bodyY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the hearing aid image - the PNG should already include the wire and receiver
    ctx.drawImage(
      hearingAidImg, 
      bodyX - ricBodyWidth / 2,
      bodyY - ricBodyHeight / 2,
      ricBodyWidth,
      ricBodyHeight
    );
    
    // Restore context
    ctx.restore();
    
    // Add product label for non-mobile
    if (!isMobile) {
      // Semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, height - 40, width, 40);
      
      // Text
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(
        `${hearingAid.name} - RIC Hearing Aid`,
        width / 2,
        height - 20
      );
    }
    
    console.log('Completed 2D image rendering');
  } catch (error) {
    console.error('Error in renderRIC2DImage:', error);
  }
};

// Check if the GLB model file exists
const checkModelFileExists = async (): Promise<boolean> => {
  try {
    const response = await fetch('/models/hearing-aid-model.glb', { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking for model file:', error);
    return false;
  }
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
    // Only proceed if this is a RIC type hearing aid
    if (!isRICHearingAid(hearingAid)) {
      showUnsupportedMessage(ctx, canvas, "This feature only works with RIC hearing aids");
      return canvas.toDataURL('image/jpeg', 0.95);
    }
    
    // Get product-specific hearing aid image path
    const hearingAidImagePath = getHearingAidImagePath(productId);
    
    // Try loading the 2D image
    const hearingAidImg = await loadImage(hearingAidImagePath);
    
    // Calculate ear position
    const earPosition = detectEarPosition(imageData);
    
    // Only proceed if we detected an ear position
    if (earPosition) {
      // Draw RIC hearing aid with proper placement
      await drawRICHearingAid(ctx, earPosition, hearingAidImg, hearingAid);
    } else {
      // If no ear detected, show an error message
      const bgHeight = 80;
      const bgY = canvas.height / 2 - bgHeight / 2;
      
      // Semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, bgY, canvas.width, bgHeight);
      
      // Text
      ctx.fillStyle = 'white';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Multi-line message
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
    console.error('Error applying hearing aid image:', e);
    
    // If any error occurs, show error message
    const bgHeight = 80;
    const bgY = canvas.height / 2 - bgHeight / 2;
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, bgY, canvas.width, bgHeight);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Multi-line message
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