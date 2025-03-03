import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TryOnARPage.css';

const TryOnARPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [isMobile, setIsMobile] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if device is mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setIsProcessing(true);
        // Simulate processing time
        setTimeout(() => {
          setIsProcessing(false);
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraPermission(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraPermission(false);
    }
  };

  const handleBack = () => {
    navigate(`/shop/product/${productId}`);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

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
            // Mobile Experience
            <div className="mobile-experience">
              {cameraPermission === null ? (
                <div className="camera-permission">
                  <h2>Try On with Your Camera</h2>
                  <p>We'll need access to your camera to show how the hearing aid looks on your ear.</p>
                  <button className="primary-button" onClick={startCamera}>
                    Start Camera
                  </button>
                </div>
              ) : cameraPermission === false ? (
                <div className="camera-error">
                  <p>Camera access denied. Please enable camera access in your browser settings.</p>
                </div>
              ) : (
                <div className="camera-view">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="camera-feed"
                  />
                  <div className="ar-overlay">
                    <div className="positioning-guide">
                      <p>Position your ear in the center</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Desktop Experience
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
                  <div className="preview-section">
                    <div className="image-preview">
                      <img src={uploadedImage} alt="Uploaded ear" />
                      {isProcessing && (
                        <div className="processing-overlay">
                          <div className="processing-spinner"></div>
                          <p>Processing your image...</p>
                        </div>
                      )}
                    </div>
                    <div className="preview-controls">
                      <button 
                        className="secondary-button"
                        onClick={() => setUploadedImage(null)}
                      >
                        Try Another Photo
                      </button>
                      <button className="primary-button">
                        Save Image
                      </button>
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