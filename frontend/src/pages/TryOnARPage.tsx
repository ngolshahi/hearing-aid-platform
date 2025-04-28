import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TryOnARPage.css';
import { getHearingAidById } from '../services';
import { ARExperience } from '../components/ARExperience';

const TryOnARPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [hearingAidData, setHearingAidData] = useState<any>(null);
  const [arError, setArError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product data on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      if (productId) {
        try {
          const product = await getHearingAidById(productId);
          setHearingAidData(product);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching product data:', error);
          setArError('Failed to load product data. Please try again later.');
          setIsLoading(false);
        }
      }
    };

    fetchProductData();
  }, [productId]);

  const handleBack = () => {
    navigate(`/shop/product/${productId}`);
  };

  const renderARExperience = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading AR experience...</p>
        </div>
      );
    }

    if (arError) {
      return (
        <div className="error-container">
          <p>{arError}</p>
          <button className="primary-button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      );
    }

    if (!hearingAidData) {
      return (
        <div className="error-container">
          <p>No hearing aid data available. Please try again later.</p>
          <button className="primary-button" onClick={handleBack}>
            Back to Product
          </button>
        </div>
      );
    }

    // Get the model path based on hearing aid type
    const modelPath = getModelPath(hearingAidData);
    const usdzPath = getUsdzPath(hearingAidData);
    
    return (
      <div className="ar-viewer-container">
        <ARExperience 
          modelPath={modelPath}
          usdzUrl={usdzPath}
          color={hearingAidData.color}
          imageUrl={hearingAidData.imageUrl || hearingAidData.images?.[0]}
        />
        <div className="ar-instructions">
          <h3>How to use AR:</h3>
          <ol>
            <li>Allow camera access when prompted</li>
            <li>Point your camera at a flat surface</li>
            <li>Tap the screen to place the hearing aid</li>
            <li>Move around to view from different angles</li>
          </ol>
        </div>
      </div>
    );
  };

  // Helper function to determine the model path based on hearing aid type
  const getModelPath = (hearingAid: any): string => {
    // Always use the existing model file
    return '/models/hearing-aid-model.glb';
  };

  // Helper function to determine the USDZ path based on hearing aid type
  const getUsdzPath = (hearingAid: any): string | undefined => {
    // Return the path to the USDZ file for Quick Look on iOS devices
    return '/models/hearing-aid-model.usdz';
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
          {renderARExperience()}
        </div>
      </div>
    </div>
  );
};

export default TryOnARPage; 