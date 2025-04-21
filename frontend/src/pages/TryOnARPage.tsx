import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TryOnARPage.css';
import { getHearingAidById } from '../services/hearingAidService';
import { processARImage, renderAROverlay } from '../services/arService';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Set that we've requested permission
      setPermissionRequested(true);
      
      const constraints = { 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted:', stream);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, initializing AR canvas');
          videoRef.current?.play();
          initARCanvas();
        };
      }
      
      setCameraPermission(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraPermission(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (cameraPermission && permissionRequested) {
      startCamera();
    }
  }, [facingMode, cameraPermission, permissionRequested]);

  const initARCanvas = useCallback(() => {
    if (!videoRef.current || !arCanvasRef.current || !canvasRef.current || !hearingAidData) {
      console.log('Missing required refs for AR canvas initialization');
      return;
    }
    
    const video = videoRef.current;
    const arCanvas = arCanvasRef.current;
    const canvas = canvasRef.current;
    
    console.log('Video dimensions:', video.videoWidth, video.videoHeight);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Try again when video dimensions are available
      setTimeout(initARCanvas, 100);
      return;
    }
    
    // Set canvas dimensions to match video
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    arCanvas.width = width;
    arCanvas.height = height;
    canvas.width = width;
    canvas.height = height;
    
    setCanvasInitialized(true);
    
    // Start AR processing loop
    processVideoFrame();
  }, [hearingAidData]);

  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || !arCanvasRef.current || !canvasRef.current || !hearingAidData) return;
    
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
      renderAROverlay(imageData, arCanvas, hearingAidData, facingMode);
    }
    
    // Continue the processing loop
    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, [hearingAidData, facingMode]);

  const handleBack = () => {
    navigate(`/shop/product/${productId}`);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const saveProcessedImage = () => {
    // For mobile: capture the current canvas state
    if (isMobile && arCanvasRef.current) {
      const dataUrl = arCanvasRef.current.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `hearing-aid-tryout-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      <button className="primary-button" onClick={startCamera}>
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
            // Mobile Experience - Real-time AR
            <div className="mobile-experience">
              {cameraPermission === null ? (
                renderPermissionRequest()
              ) : cameraPermission === false ? (
                renderPermissionDenied()
              ) : (
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
                  
                  <div className="ar-overlay">
                    <div className="positioning-guide">
                      <p>Position your ear in the center</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                        onClick={() => setUploadedImage(null)}
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