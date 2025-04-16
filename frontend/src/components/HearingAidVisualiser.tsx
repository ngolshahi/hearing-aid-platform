import React, { useState, useEffect } from 'react';
import '../styles/HearingAidVisualiser.css';

interface HearingAidVisualiserProps {
  productId: string;
  selectedColor: string;
  modelType?: string;  // New prop for model type (e.g., 'mric-r', 'ric-rt')
  brandLine?: string;  // New prop for brand line (e.g., 'genesis-ai')
  onVisualiserClose?: () => void;
}

// Define possible model paths in a type map
interface ModelPathConfig {
  brandLine: string;
  modelPath: string;
}

// Map product types to their respective image path components
const MODEL_PATHS: Record<string, ModelPathConfig> = {
  'mric-r': { 
    brandLine: 'genesis-ai',
    modelPath: 'mric-r' 
  },
  'ric-rt': { 
    brandLine: 'genesis-ai',
    modelPath: 'ric-rt' 
  },
  'itc-r': {
    brandLine: 'genesis-ai',
    modelPath: 'itc-r' 
  },
  // Add more models as needed
};

const HearingAidVisualiser: React.FC<HearingAidVisualiserProps> = ({ 
  productId, 
  selectedColor,
  modelType = 'mric-r', // Default to mRIC if not specified
  brandLine: propBrandLine,
  onVisualiserClose 
}) => {
  const [currentRotation, setCurrentRotation] = useState<number>(15);
  
  // Get the model configuration based on the modelType
  const getModelConfig = () => {
    // Use the provided model type or look it up in our map
    const config = MODEL_PATHS[modelType] || MODEL_PATHS['mric-r']; // Default to mRIC
    
    // Override brandLine if provided as a prop
    return {
      ...config,
      brandLine: propBrandLine || config.brandLine
    };
  };
  
  // Convert hex color codes to color names for image URLs
  const getColorName = (hexColor: string): string => {
    const colorMap: Record<string, string> = {
      '#4e312d': 'chestnut-standard', // Chestnut
      '#bec2cb': 'silver', // Silver
      '#708090': 'graphite-gray', // Slate Gray
      '#CD7F32': 'caramel', // Bronze
      '#F7E7CE': 'beige', // Cream
      '#FFFFFF': 'white', // White (if needed)
      '#000000': 'tech-black', // Black (if needed)
      '#000001': 'black',
      '#43301e': 'dark-brown',
      '#7f5024': 'chestnut-custom',
      '#7b5942': 'medium-brown',
      '#a57c59': 'light-brown',
      '#cea98d': 'pink',
    };
    
    return colorMap[hexColor] || 'silver'; // Default to silver if color not found
  };

  // Generate the image URL based on the current color, rotation, and model type
  const getImageUrl = (hexColor: string, rotation: number) => {
    const colorName = getColorName(hexColor);
    const { brandLine, modelPath } = getModelConfig();
    
    return `https://www.starkeypro.com/-/media/Project/Starkey/StarkeyMaster/products/360s/${brandLine}/${modelPath}/hearing-aid/${colorName}/${rotation}.jpg`;
  };

  const handleRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentRotation(parseInt(event.target.value));
  };

  return (
    <div className="hearing-aid-visualiser">
      <div className="visualiser-content">
        <div className="visualiser-header">
          <h3>3D View</h3>
          {onVisualiserClose && (
            <button 
              className="visualiser-close-button" 
              onClick={onVisualiserClose}
              aria-label="Close 3D view"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="visualiser-image-container">
          <img 
            src={getImageUrl(selectedColor, currentRotation)} 
            alt={`Hearing aid 3D view`}
            className="visualiser-image"
          />
        </div>
        
        <div className="rotation-control">
          <label htmlFor="rotation-range" className="rotation-label">
            Rotate 360°
            <input 
              type="range" 
              id="rotation-range"
              className="rotation-range" 
              min="0" 
              max="17" 
              value={currentRotation} 
              step="1" 
              onChange={handleRotationChange}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default HearingAidVisualiser;