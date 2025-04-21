import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TryOnARPage.css';
import { getHearingAidById, processARImage, renderAROverlay } from '../services';

const TryOnARPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [isMobile, setIsMobile] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [hearingAidData, setHearingAidData] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [arError, setArError] = useState<string | null>(null);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const initTimeoutRef = useRef<number | null>(null);

  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || !arCanvasRef.current || !canvasRef.current || !hearingAidData) {
      return;
    }
    
    try {
      const video = videoRef.current;
      const arCanvas = arCanvasRef.current;
      const canvas = canvasRef.current;
      
      // Draw current video frame to the hidden canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get the frame data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Render AR overlay onto the visible canvas
        renderAROverlay(imageData, arCanvas, hearingAidData, facingMode)
          .catch(error => {
            console.error('Error in renderAROverlay:', error);
          });
      }
      
      // Continue the processing loop
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    } catch (error) {
      console.error('Error in processVideoFrame:', error);
      // Don't set error state here to avoid flooding UI with errors
      // Just try to continue processing
      animationFrameRef.current = requestAnimationFrame(processVideoFrame);
    }
  }, [hearingAidData, facingMode]);

  // Check and request permissions when the component mounts if on mobile
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // First check if permissions API is available
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'camera' as any });
          
          if (result.state === 'granted') {
            setCameraPermission(true);
            setPermissionRequested(true);
          } else if (result.state === 'prompt') {
            setCameraPermission(null);
          } else if (result.state === 'denied') {
            setCameraPermission(false);
            setPermissionRequested(true);
          }
        }
      } catch (error) {
        console.log('Permission API not supported, will request directly when needed');
      }
    };

    if (isMobile) {
      checkPermissions();
    }
  }, [isMobile]);

  // Fetch product data on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      if (productId) {
        try {
          const product = await getHearingAidById(productId);
          setHearingAidData(product);
        } catch (error) {
          console.error('Error fetching product data:', error);
          setArError('Failed to load product data. Please try again later.');
        }
      }
    };

    fetchProductData();
  }, [productId]);

  useEffect(() => {
    // Check if device is mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setArError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        setUploadedImage(imageDataUrl);
        setIsProcessing(true);
        
        try {
          // Process the image to overlay the hearing aid
          const result = await processARImage(imageDataUrl, productId || '');
          setProcessedImage(result);
        } catch (error) {
          console.error('Error processing image:', error);
          setArError('Failed to process image. Please try a different photo or check your connection.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const initializeCamera = useCallback(async () => {
    try {
      if (!videoRef.current) {
        return;
      }

      // Clear any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Initialize canvas sizes with a safe default
      if (canvasRef.current && arCanvasRef.current) {
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
        arCanvasRef.current.width = 640;
        arCanvasRef.current.height = 480;
      }

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // If no video devices, show error
      if (videoDevices.length === 0) {
        setVideoAvailable(false);
        setArError('No camera detected on your device.');
        return;
      }

      // Request camera access with more specific constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Check if video ref still exists (component not unmounted)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Set up video element event handlers
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          
          // Update canvas dimensions once video metadata is loaded
          if (canvasRef.current && arCanvasRef.current) {
            // Match canvas size to actual video dimensions for optimal rendering
            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;
            
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            arCanvasRef.current.width = videoWidth;
            arCanvasRef.current.height = videoHeight;
          }
          
          // Start processing video frames
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(processVideoFrame);
          
          // Mark canvas as initialized
          setCanvasInitialized(true);
        };
        
        // Handle video playing
        videoRef.current.onplay = () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(processVideoFrame);
        };
        
        // Handle errors during video playback
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setArError('Error with camera video stream. Please try reloading.');
        };
        
        // Force play the video (needed for some mobile browsers)
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          setArError('Could not start camera stream. Please check permissions and try again.');
        });
      }
      
      setCameraPermission(true);
    } catch (error) {
      console.error('Error initializing camera:', error);
      
      if ((error as DOMException).name === 'NotAllowedError') {
        setCameraPermission(false);
      } else if ((error as DOMException).name === 'NotFoundError') {
        setVideoAvailable(false);
        setArError('Camera not found. Please ensure your device has a working camera.');
      } else {
        setArError(`Camera error: ${(error as Error).message || 'Unknown error'}`);
      }
    }
  }, [facingMode, processVideoFrame]);

  const requestCameraAccess = async () => {
    try {
      setPermissionRequested(true);
      
      // First check permissions status if available
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
          
          if (permissionStatus.state === 'granted') {
            setCameraPermission(true);
            initializeCamera();
            return;
          } else if (permissionStatus.state === 'denied') {
            setCameraPermission(false);
            return;
          }
          // Otherwise continue to request
        } catch (permError) {
          console.log('Permissions API not fully supported, requesting directly');
        }
      }
      
      // Request camera access - minimal request to trigger permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // If successful, stop this test stream and initialize the actual camera
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission(true);
      
      // Add a small delay before initializing camera
      // This helps with some mobile browsers that need a moment after permission
      setTimeout(() => {
        initializeCamera();
      }, 500);
    } catch (error) {
      console.error('Error requesting camera access:', error);
      
      if ((error as DOMException).name === 'NotAllowedError') {
        setCameraPermission(false);
      } else {
        setArError(`Could not access camera: ${(error as Error).message || 'Unknown error'}`);
      }
    }
  };

  const toggleCamera = async () => {
    // Set new facing mode
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    
    // Stop existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop all tracks on current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear error state
    setArError(null);
    
    // Re-initialize with new facing mode (using a slight delay for better switching)
    setTimeout(() => {
      initializeCamera();
    }, 300);
  };

  const retryCamera = () => {
    // Clear any existing error
    setArError(null);
    
    // Reset permission if needed
    if (cameraPermission === false) {
      setPermissionRequested(false);
      setCameraPermission(null);
    } else {
      // Just retry initialization
      initializeCamera();
    }
  };

  const handleBack = () => {
    navigate(`/shop/product/${productId}`);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const saveProcessedImage = () => {
    // For mobile: capture the current canvas state
    if (isMobile && arCanvasRef.current) {
      try {
        const dataUrl = arCanvasRef.current.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `hearing-aid-tryout-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error saving image:', error);
        setArError('Failed to save image. Please try again.');
      }
      return;
    }
    
    // For desktop: use the already processed image
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `hearing-aid-tryout-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderPermissionRequest = () => (
    <div className="camera-permission">
      <h2>Try On with Your Camera</h2>
      <p>We'll need access to your camera to show how the hearing aid looks on your ear.</p>
      <p className="permission-note">Please allow camera access when prompted by your browser.</p>
      <button className="primary-button" onClick={requestCameraAccess}>
        Start Camera
      </button>
    </div>
  );

  const renderPermissionDenied = () => (
    <div className="camera-error">
      <p>Camera access denied. Please enable camera access in your browser settings.</p>
      <div className="permission-instructions">
        <h3>How to enable camera access:</h3>
        <ul>
          <li>Click on the padlock or info icon in your browser's address bar</li>
          <li>Select "Site settings" or "Permissions"</li>
          <li>Enable access to your camera</li>
          <li>Reload this page</li>
        </ul>
        <button className="primary-button" onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    </div>
  );

  const MobileExperience = () => (
    <div className="mobile-experience">
      {arError && (
        <div className="camera-error">
          <p>{arError}</p>
          <button className="primary-button" onClick={retryCamera}>
            Try Again
          </button>
        </div>
      )}

      {!arError && cameraPermission === null ? (
        renderPermissionRequest()
      ) : !arError && cameraPermission === false ? (
        renderPermissionDenied()
      ) : !arError && !videoAvailable ? (
        <div className="camera-error">
          <p>No camera detected on your device.</p>
          <p>You can still try our desktop experience by uploading a photo.</p>
        </div>
      ) : !arError && (
        <div className="camera-view">
          {/* Video element for camera stream */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="camera-feed"
          />
          
          {/* Hidden canvas for processing frames */}
          <canvas 
            ref={canvasRef}
            className="processing-canvas hidden"
          />
          
          {/* Visible canvas for AR overlay */}
          <canvas 
            ref={arCanvasRef}
            className="ar-canvas"
          />
          
          <div className="ar-controls">
            <button className="camera-toggle" onClick={toggleCamera}>
              Switch Camera
            </button>
            <button className="capture-button" onClick={saveProcessedImage}>
              Capture
            </button>
          </div>
          
          <div className="positioning-guide">
            <p>Position your ear in the center</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="try-on-page">
      <div className="try-on-content">
        <div className="try-on-header">
          <button className="back-button" onClick={handleBack}>
            <span className="back-icon">←</span>
            <span>Back to Product</span>
          </button>
          <h1>Virtual Try-On Experience</h1>
        </div>

        <div className="try-on-container">
          {isMobile ? (
            <MobileExperience />
          ) : (
            // Desktop Experience - Upload & Process
            <div className="desktop-experience">
              <div className="upload-section">
                {!uploadedImage ? (
                  <>
                    <div className="upload-area" onClick={triggerFileUpload}>
                      <div className="upload-content">
                        <span className="upload-icon">📷</span>
                        <h2>Upload an Image</h2>
                        <p>Take or upload a clear photo of your ear</p>
                        <button className="upload-button">
                          Choose Image
                        </button>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden-input"
                    />
                  </>
                ) : (
                  <div className="preview-container">
                    <div className="image-comparison">
                      <div className="original-image">
                        <h3>Original</h3>
                        <div className="image-preview">
                          <img src={uploadedImage} alt="Uploaded ear" />
                        </div>
                      </div>
                      
                      <div className="processed-image">
                        <h3>With Hearing Aid</h3>
                        <div className="image-preview">
                          {isProcessing ? (
                            <div className="processing-overlay">
                              <div className="processing-spinner"></div>
                              <p>Processing your image...</p>
                            </div>
                          ) : processedImage ? (
                            <img src={processedImage} alt="Ear with hearing aid" />
                          ) : arError ? (
                            <div className="processing-error">
                              <p>{arError}</p>
                            </div>
                          ) : (
                            <div className="processing-error">
                              <p>Processing failed. Please try a different image.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="preview-controls">
                      <button 
                        className="secondary-button"
                        onClick={() => {
                          setUploadedImage(null);
                          setProcessedImage(null);
                          setArError(null);
                        }}
                      >
                        Try Another Photo
                      </button>
                      {processedImage && (
                        <button 
                          className="primary-button"
                          onClick={saveProcessedImage}
                        >
                          Save Image
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="instructions">
                <h3>Tips for best results:</h3>
                <ul>
                  <li>Ensure good lighting</li>
                  <li>Take photo from the side</li>
                  <li>Keep hair away from ear</li>
                  <li>Use a plain background</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOnARPage; 