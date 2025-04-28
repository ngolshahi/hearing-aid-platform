import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/TryOnARPage.css';
import { getHearingAidById } from '../services';
import ARViewer from '../components/ARViewer';

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
    
    return (
      <div className="ar-viewer-container">
        <ARViewer 
          modelPath={modelPath}
          scale={0.8}
          position={[0, 0, 0]}
          rotation={[0, Math.PI / 4, 0]}
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
    // Default model path
    let modelPath = '/models/hearing-aid-model.glb';
    
    // If the hearing aid has a specific model path, use it
    if (hearingAid.modelPath) {
      modelPath = hearingAid.modelPath;
    } else {
      // Otherwise, determine based on type
      const type = hearingAid.type?.toLowerCase() || '';
      if (type.includes('ric')) {
        modelPath = '/models/ric-hearing-aid.glb';
      } else if (type.includes('bte')) {
        modelPath = '/models/bte-hearing-aid.glb';
      } else if (type.includes('itc')) {
        modelPath = '/models/itc-hearing-aid.glb';
      } else if (type.includes('cic')) {
        modelPath = '/models/cic-hearing-aid.glb';
      }
    }
    
    return modelPath;
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