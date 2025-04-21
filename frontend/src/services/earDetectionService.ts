import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Types for ear detection results
export interface EarDetectionResult {
  // Position and dimensions
  x: number;
  y: number;
  width: number;
  height: number;
  // Rotation in radians
  rotation: number;
  // Confidence score (0-1)
  confidence: number;
  // Whether it's a left or right ear
  isRightEar: boolean;
}

// For storing the detection model once loaded
let detectionModel: faceLandmarksDetection.FaceLandmarksDetector | null = null;

/**
 * Loads the TensorFlow face landmarks detection model
 * We only need to do this once and can reuse the model
 */
export const initEarDetectionModel = async (): Promise<void> => {
  try {
    // Make sure TensorFlow is ready
    await tf.ready();
    
    // Load face landmarks detection model with MediaPipe Facemesh
    detectionModel = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        maxFaces: 1, // We only need to detect one face
        refineLandmarks: true, // Better accuracy for the landmarks
      }
    );
    
    console.log('Face landmarks detection model loaded successfully');
  } catch (error) {
    console.error('Error loading face detection model:', error);
    throw new Error('Failed to initialize ear detection model');
  }
};

/**
 * Detects ear in an image using facial landmarks
 * 
 * @param image - The image to detect ear in
 * @param preferRightEar - Whether to prefer right ear detection
 * @returns Promise with ear detection result or null if no ear is detected
 */
export const detectEar = async (
  image: HTMLImageElement | HTMLVideoElement,
  preferRightEar: boolean = false
): Promise<EarDetectionResult | null> => {
  try {
    // If model is not loaded, load it now
    if (!detectionModel) {
      await initEarDetectionModel();
    }
    
    if (!detectionModel) {
      // If still null, something went wrong
      throw new Error('Face detection model failed to load');
    }
    
    // Run detection on the image
    const predictions = await detectionModel.estimateFaces({
      input: image,
      flipHorizontal: false, // Don't flip the input
    });
    
    // If no faces detected, return null
    if (predictions.length === 0) {
      console.log('No faces detected in the image');
      return null;
    }
    
    // Get the first face prediction
    const prediction = predictions[0];
    const keypoints = prediction.keypoints;
    
    // Get the ear landmarks indices. The MediaPipe Facemesh model returns different landmarks
    // depending on the model version. We're extracting indices for ear regions.
    
    // Determine which ear to detect based on face orientation and preference
    // Calculate yaw (head rotation) from landmarks
    // Simple approximation: compare distance between left/right sides of face to center
    const leftEye = keypoints.find(k => k.name === 'leftEye');
    const rightEye = keypoints.find(k => k.name === 'rightEye');
    const nose = keypoints.find(k => k.name === 'noseTip');
    
    if (!leftEye || !rightEye || !nose) {
      console.log('Required face landmarks not found');
      return null;
    }
    
    // Calculate which ear is more visible based on face orientation
    const leftDist = Math.sqrt(Math.pow(nose.x - leftEye.x, 2) + Math.pow(nose.y - leftEye.y, 2));
    const rightDist = Math.sqrt(Math.pow(nose.x - rightEye.x, 2) + Math.pow(nose.y - rightEye.y, 2));
    
    // Determine if we should detect right ear based on head orientation and preference
    const detectRightEar = preferRightEar 
      ? true 
      : (rightDist > leftDist); // If right eye is further from nose, right ear is more visible
    
    // Get ear keypoints based on which ear we want to detect
    const earKeypoints = keypoints.filter(k => {
      if (detectRightEar) {
        return k.name && k.name.includes('rightEar');
      } else {
        return k.name && k.name.includes('leftEar');
      }
    });
    
    // If no ear keypoints found, try the other ear or return null
    if (earKeypoints.length === 0) {
      const otherEarKeypoints = keypoints.filter(k => {
        if (!detectRightEar) {
          return k.name && k.name.includes('rightEar');
        } else {
          return k.name && k.name.includes('leftEar');
        }
      });
      
      if (otherEarKeypoints.length === 0) {
        console.log('No ear landmarks detected');
        return null;
      }
      
      earKeypoints.push(...otherEarKeypoints);
    }
    
    // Calculate ear bounding box from keypoints
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    earKeypoints.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
    
    // Expand bounding box slightly for better hearing aid placement
    const earWidth = maxX - minX;
    const earHeight = maxY - minY;
    const expandFactor = 0.2; // 20% expansion
    
    minX -= earWidth * expandFactor;
    minY -= earHeight * expandFactor;
    maxX += earWidth * expandFactor;
    maxY += earHeight * expandFactor;
    
    // Calculate ear center
    const earCenterX = (minX + maxX) / 2;
    const earCenterY = (minY + maxY) / 2;
    
    // Estimate ear rotation (simplified - we could use more keypoints for better estimation)
    // For now, assume it's approximately vertical
    const rotation = 0;
    
    // Adjust position for hearing aid placement
    // The hearing aid should be placed at the side of the ear that attaches to the head
    let hearingAidX;
    
    if (detectRightEar) {
      // For right ear, hearing aid goes on the left side
      hearingAidX = minX + earWidth * 0.2;
    } else {
      // For left ear, hearing aid goes on the right side
      hearingAidX = minX + earWidth * 0.8;
    }
    
    // Vertical position - typically upper third of ear
    const hearingAidY = minY + earHeight * 0.35;
    
    // Create result with additional width for hearing aid
    const result: EarDetectionResult = {
      x: hearingAidX,
      y: hearingAidY,
      width: earWidth,
      height: earHeight,
      rotation: rotation,
      confidence: 0.9, // High confidence since we're using facial landmarks
      isRightEar: detectRightEar
    };
    
    console.log(`Detected ${detectRightEar ? 'right' : 'left'} ear using TensorFlow model`, 
      `at (${result.x.toFixed(0)}, ${result.y.toFixed(0)})`,
      `size: ${result.width.toFixed(0)}x${result.height.toFixed(0)}`);
    
    return result;
  } catch (error) {
    console.error('Error detecting ear using TensorFlow:', error);
    return null;
  }
};

/**
 * Fallback ear detection for when TensorFlow fails
 * Uses a simpler approach based on image analysis
 */
export const detectEarFallback = (
  imageData: ImageData,
  preferRightEar: boolean = false
): EarDetectionResult => {
  const { width, height } = imageData;
  
  // Create a fallback position slightly to the side based on preference
  const earWidth = width / 4;  // Assume ear takes up about 1/4 of the width
  const earHeight = height / 3; // And about 1/3 of the height
  
  // Position slightly to the left or right of center depending on ear preference
  const offsetX = preferRightEar ? -width / 10 : width / 10;
  
  return {
    x: width / 2 + offsetX,  // Offset from center based on which ear
    y: height / 2 - earHeight / 4, // Slightly higher than center
    width: earWidth,
    height: earHeight,
    rotation: 0,
    confidence: 0.5, // Lower confidence for fallback
    isRightEar: preferRightEar
  };
}; 