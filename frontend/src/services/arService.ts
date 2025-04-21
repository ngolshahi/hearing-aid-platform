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
  
  try {
    // Get product-specific hearing aid image path
    const hearingAidImagePath = getHearingAidImagePath(productId);
    
    // Try loading the 2D image
    const hearingAidImg = await loadImage(hearingAidImagePath);
    
    // Calculate ear position - for 2D image we'll use a simple detection
    // In a real implementation, this would use the TensorFlow ear detection
    const earPosition = detectEarPosition(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    if (earPosition) {
      // Calculate size for hearing aid image
      const hearingAidWidth = earPosition.width * 1.2; // Slightly larger than ear
      const hearingAidHeight = hearingAidWidth * (hearingAidImg.height / hearingAidImg.width);
      
      // Position the hearing aid next to the ear
      const hearingAidX = earPosition.isRightEar 
        ? earPosition.x - hearingAidWidth * 0.8  // For right ear, position to the left
        : earPosition.x + earPosition.width * 0.3; // For left ear, position to the right
      
      const hearingAidY = earPosition.y - hearingAidHeight * 0.3; // Position slightly above ear center
      
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
      
      // Draw hearing aid with color
      ctx.drawImage(
        hearingAidImg, 
        hearingAidX, 
        hearingAidY, 
        hearingAidWidth, 
        hearingAidHeight
      );
      
      // Restore context (undoing any rotation and flipping)
      ctx.restore();
      
      // Add product label
      renderProductLabel(ctx, earPosition, hearingAid);
    }
  } catch (e) {
    console.error('Error applying 2D hearing aid image, falling back to 3D model:', e);
    
    // If 2D image approach fails, fall back to 3D model rendering
    const earPosition = detectEarPosition(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    if (earPosition) {
      try {
        // Try 3D model approach as fallback
        const hasWebGL = !!window.WebGLRenderingContext;
        if (hasWebGL) {
          const model = await loadModel();
          renderHearingAid3D(ctx, model, earPosition, productId);
          renderProductLabel(ctx, earPosition, hearingAid);
        } else {
          // If WebGL is not available, use simple 2D rendering
          await renderHearingAid2D(
            ctx, 
            earPosition, 
            hearingAid,
            earPosition.x + (earPosition.width * 0.15),
            earPosition.y + (earPosition.height * 0.25),
            earPosition.width / 180,
            productId
          );
          renderProductLabel(ctx, earPosition, hearingAid);
        }
      } catch (modelError) {
        console.error('3D model fallback also failed:', modelError);
        // If all else fails, use the simplest 2D rendering method
        await renderHearingAid2D(
          ctx, 
          earPosition, 
          hearingAid,
          earPosition.x + (earPosition.width * 0.15),
          earPosition.y + (earPosition.height * 0.25),
          earPosition.width / 180,
          productId
        );
        renderProductLabel(ctx, earPosition, hearingAid);
      }
    }
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
  MIN_EAR_PIXELS: 100
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
const detectEarPosition = (imageData: ImageData): EarPosition => {
  const { data, width, height } = imageData;
  
  // Skip processing for tiny images
  if (width < 100 || height < 100) {
    console.log('Image too small for ear detection, using fallback position');
    return createFallbackEarPosition(width, height);
  }
  
  // Accumulate potential ear pixels
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
  if (skinPixelRatio < 0.01 || skinPixelRatio > 0.8) {
    console.log(`Skin pixel ratio ${skinPixelRatio.toFixed(2)} outside expected range, using fallback position`);
    return createFallbackEarPosition(width, height);
  }
  
  if (earPixels.length < EAR_DETECTION.MIN_EAR_PIXELS) {
    console.log('Not enough ear pixels detected, using fallback center position');
    return createFallbackEarPosition(width, height);
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
  const relevantPixels = earPixels.filter(pixel => 
    isRightEar ? pixel.x < midX : pixel.x >= midX
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
    console.log('Ear dimensions validation failed, using fallback position');
    return createFallbackEarPosition(width, height);
  }
  
  // Calculate the ear center
  const centerX = minX + earWidth / 2;
  const centerY = minY + earHeight / 2;
  
  // Determine rotation (minimal rotation for 2D overlay approach)
  const rotation = 0;
  
  // Adjust positioning for hearing aid placement
  // Position at the side where the ear connects to the head
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

// Create a fallback ear position in the center of the image
const createFallbackEarPosition = (width: number, height: number): EarPosition => {
  const earWidth = width / 4;  // Assume ear takes up about 1/4 of the width
  const earHeight = height / 3; // And about 1/3 of the height
  
  // Randomly determine if this is a right or left ear
  const isRightEar = Math.random() < 0.5;
  
  // Position slightly to the left or right of center depending on ear side
  const offsetX = isRightEar ? -width / 10 : width / 10;
  
  return {
    x: width / 2 + offsetX,
    y: height / 2 - earHeight / 4,
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