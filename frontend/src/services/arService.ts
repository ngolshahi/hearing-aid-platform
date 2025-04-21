import axios from 'axios';
import { HearingAid } from './hearingAidService';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Adjust this URL based on where your backend is running - should match hearingAidService.ts
const API_URL = 'http://192.168.0.244:8080/api';

// Cache for hearing aid 3D models and textures
const modelCache: Record<string, THREE.Group> = {};
const textureCache: Record<string, THREE.Texture> = {};

// Load 3D model
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
    // First try server-side processing
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
    console.error('Error processing AR image on server, falling back to client-side:', error);
    
    // Fall back to client-side processing
    try {
      const hearingAid = await fetchHearingAid(productId);
      return applyHearingAidToImage(imageDataUrl, hearingAid, hearingAid.colors[0] || '#A0A0A0');
    } catch (clientError) {
      console.error('Client-side processing failed:', clientError);
      throw clientError;
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

// Enhanced ear detection parameters
const EAR_DETECTION = {
  // Minimum ear width in pixels
  MIN_WIDTH: 60,
  
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
    }
  ],
  
  // Edge detection threshold
  EDGE_THRESHOLD: 30
};

// Helper function to detect if a pixel might be part of an ear (based on multiple color ranges)
const isEarPixel = (r: number, g: number, b: number): boolean => {
  return EAR_DETECTION.COLOR_RANGES.some(range => {
    return r >= range.rMin && r <= range.rMax &&
           g >= range.gMin && g <= range.gMax &&
           b >= range.bMin && b <= range.bMax;
  });
};

// Function to detect ear position in an image with enhanced accuracy
const detectEarPosition = (imageData: ImageData): { x: number, y: number, width: number, height: number, rotation: number } | null => {
  const { data, width, height } = imageData;
  
  // Accumulate potential ear pixels
  const earPixels: { x: number, y: number }[] = [];
  
  // First pass: collect potential ear pixels by color
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
  
  if (earPixels.length < 200) {
    return null; // Not enough ear pixels found
  }
  
  // Calculate bounds of ear pixels
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
  
  // Basic validation of ear dimensions
  if (earWidth < EAR_DETECTION.MIN_WIDTH || earHeight < earWidth) {
    return null;
  }
  
  // Crude estimation of ear center and orientation
  // Find the approximate center of the ear
  const centerX = minX + earWidth / 2;
  const centerY = minY + earHeight / 2;
  
  // Calculate density distribution to estimate ear orientation
  let topHalf = 0;
  let bottomHalf = 0;
  let leftHalf = 0;
  let rightHalf = 0;
  
  earPixels.forEach(pixel => {
    if (pixel.y < centerY) topHalf++;
    else bottomHalf++;
    
    if (pixel.x < centerX) leftHalf++;
    else rightHalf++;
  });
  
  // Estimate rotation based on density distribution
  // This is a very crude approximation
  let rotation = 0;
  if (topHalf > bottomHalf * 1.5) {
    rotation = -Math.PI / 6; // Ear tilted up
  } else if (bottomHalf > topHalf * 1.5) {
    rotation = Math.PI / 6; // Ear tilted down
  }
  
  // Adjust positioning based on ear shape analysis
  const adjustedX = minX + earWidth * 0.3; // Position closer to the front of the ear
  const adjustedY = minY + earHeight * 0.4; // Position in the middle upper part of the ear
  
  return {
    x: adjustedX,
    y: adjustedY,
    width: earWidth,
    height: earHeight,
    rotation: rotation
  };
};

// Render AR overlay on the canvas based on video frame
export const renderAROverlay = async (
  imageData: ImageData, 
  canvas: HTMLCanvasElement, 
  hearingAid: HearingAid,
  facingMode: 'user' | 'environment'
): Promise<void> => {
  if (!canvas || !hearingAid) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Draw the original frame first
  ctx.putImageData(imageData, 0, 0);
  
  // Detect ear in the frame
  const earRegion = detectEarPosition(imageData);
  
  if (earRegion) {
    // Calculate hearing aid position based on ear region
    const hearingAidX = facingMode === 'user'
      ? earRegion.x - (earRegion.width * 0.1) // Adjust for front camera mirror effect
      : earRegion.x + (earRegion.width * 0.15);
      
    const hearingAidY = earRegion.y + (earRegion.height * 0.25); // Position approximately at middle of ear
    
    // Calculate hearing aid dimensions proportional to ear size
    const hearingAidScale = earRegion.width / 180; // Adjust scale factor as needed
    
    try {
      // Try to use 3D model rendering if available
      const hasWebGL = !!window.WebGLRenderingContext;
      if (hasWebGL && window.innerWidth > 480) { // Use 3D model on larger screens with WebGL
        try {
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
          
          // Add hearing aid model
          try {
            const model = await loadModel();
            const modelClone = model.clone();
            
            // Apply color to model material
            const color = hearingAid.colors && hearingAid.colors.length > 0 
              ? hearingAid.colors[0] 
              : '#A0A0A0';
              
            modelClone.traverse((object) => {
              if ((object as THREE.Mesh).isMesh) {
                const mesh = object as THREE.Mesh;
                if (mesh.material) {
                  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                  materials.forEach(material => {
                    if (material instanceof THREE.MeshStandardMaterial) {
                      material.color.set(color);
                    }
                  });
                }
              }
            });
            
            // Apply rotation to match ear orientation
            modelClone.rotation.y = Math.PI / 2;
            modelClone.rotation.x = earRegion.rotation;
            
            // Apply scale
            const scaleFactor = 0.8 * hearingAidScale;
            modelClone.scale.set(scaleFactor, scaleFactor, scaleFactor);
            
            scene.add(modelClone);
            
            // Render the model
            renderer.render(scene, camera);
            
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
            
            // Skip 2D rendering when 3D model was used
            renderProductLabel(ctx, earRegion, hearingAid);
            return;
          } catch (modelError) {
            console.error('Error rendering 3D model, falling back to 2D:', modelError);
            // Continue to 2D rendering fallback
          }
        } catch (threeError) {
          console.error('Error setting up 3D renderer, falling back to 2D:', threeError);
          // Continue to 2D rendering fallback
        }
      }
    } catch (webglError) {
      console.error('WebGL not supported, using 2D fallback:', webglError);
      // Continue with 2D fallback
    }
    
    // 2D fallback rendering
    renderHearingAid2D(ctx, earRegion, hearingAid, hearingAidX, hearingAidY, hearingAidScale, facingMode);
    renderProductLabel(ctx, earRegion, hearingAid);
  }
};

// Render a 2D hearing aid
const renderHearingAid2D = (
  ctx: CanvasRenderingContext2D,
  earRegion: { x: number, y: number, width: number, height: number, rotation: number },
  hearingAid: HearingAid,
  hearingAidX: number,
  hearingAidY: number,
  hearingAidScale: number,
  facingMode: 'user' | 'environment'
): void => {
  // Get color from hearing aid data
  const color = hearingAid.colors && hearingAid.colors.length > 0 
    ? hearingAid.colors[0] 
    : '#A0A0A0';
  
  const bodyWidth = hearingAidScale * 25;
  const bodyHeight = hearingAidScale * 40;
  
  // Save current context state
  ctx.save();
  
  // Move to hearing aid position and apply rotation
  ctx.translate(hearingAidX, hearingAidY);
  ctx.rotate(earRegion.rotation);
  
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
  
  // Draw hearing aid tube
  const tubeDirection = facingMode === 'user' ? -1 : 1;
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
};

// Render product label
const renderProductLabel = (
  ctx: CanvasRenderingContext2D,
  earRegion: { x: number, y: number, width: number, height: number, rotation: number },
  hearingAid: HearingAid
): void => {
  const labelWidth = earRegion.width;
  const labelHeight = 30;
  const labelX = earRegion.x;
  const labelY = earRegion.y + earRegion.height + 10;
  
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

// Load and apply hearing aid model to an image
export const applyHearingAidToImage = async (
  imageDataUrl: string,
  hearingAid: HearingAid,
  colorHex: string
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
  
  // Draw the image to the canvas
  ctx.drawImage(img, 0, 0);
  
  // Get image data for ear detection
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Detect ear in the image
  const earRegion = detectEarPosition(imageData);
  
  if (earRegion) {
    try {
      // Try 3D model approach first
      const hasWebGL = !!window.WebGLRenderingContext;
      if (hasWebGL) {
        try {
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
          
          // Add hearing aid model
          const model = await loadModel();
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
          modelClone.rotation.y = Math.PI / 2;
          modelClone.rotation.x = earRegion.rotation;
          
          // Apply scale
          const hearingAidScale = earRegion.width / 180;
          const scaleFactor = 0.8 * hearingAidScale;
          modelClone.scale.set(scaleFactor, scaleFactor, scaleFactor);
          
          scene.add(modelClone);
          
          // Render the model
          renderer.render(scene, camera);
          
          // Calculate hearing aid position
          const hearingAidX = earRegion.x + (earRegion.width * 0.15);
          const hearingAidY = earRegion.y + (earRegion.height * 0.25);
          
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
        } catch (e) {
          console.error('3D model rendering failed, falling back to 2D:', e);
          // If 3D rendering fails, fall back to 2D
          renderHearingAid2D(
            ctx, 
            earRegion, 
            hearingAid,
            earRegion.x + (earRegion.width * 0.15),
            earRegion.y + (earRegion.height * 0.25),
            earRegion.width / 180,
            'environment'
          );
        }
      } else {
        // If WebGL is not supported, use 2D rendering
        renderHearingAid2D(
          ctx, 
          earRegion, 
          hearingAid,
          earRegion.x + (earRegion.width * 0.15),
          earRegion.y + (earRegion.height * 0.25),
          earRegion.width / 180,
          'environment'
        );
      }
    } catch (error) {
      console.error('Error in ear visualization:', error);
      // Fall back to simple 2D rendering on error
      renderHearingAid2D(
        ctx, 
        earRegion, 
        hearingAid,
        earRegion.x + (earRegion.width * 0.15),
        earRegion.y + (earRegion.height * 0.25),
        earRegion.width / 180,
        'environment'
      );
    }
    
    // Add product label
    renderProductLabel(ctx, earRegion, hearingAid);
  }
  
  // Convert the processed canvas to data URL
  return canvas.toDataURL('image/jpeg', 0.9);
}; 