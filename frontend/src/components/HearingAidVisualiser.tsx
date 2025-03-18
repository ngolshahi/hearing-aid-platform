import React, { useState, useEffect } from 'react';
import '../styles/HearingAidVisualiser.css';

interface HearingAidVisualiserProps {
  productId: string;
  selectedColor: string;
  onVisualiserClose?: () => void;
}

const HearingAidVisualiser: React.FC<HearingAidVisualiserProps> = ({ 
  productId, 
  selectedColor,
  onVisualiserClose 
}) => {
  const [currentRotation, setCurrentRotation] = useState<number>(15);
  
  // Convert hex color codes to color names for image URLs
  const getColorName = (hexColor: string): string => {
    const colorMap: Record<string, string> = {
      '#4e312d': 'chestnut-standard', // Chestnut
      '#bec2cb': 'silver', // Silver
      '#708090': 'graphite-gray', // Slate Gray
      '#CD7F32': 'caramel', // Bronze
      '#F7E7CE': 'beige', // Cream
      '#FFFFFF': 'white', // White (if needed)
      '#000000': 'tech-black' // Black (if needed)
    };
    
    return colorMap[hexColor] || 'silver'; // Default to silver if color not found
  };

  // Generate the image URL based on the current color and rotation
  const getImageUrl = (hexColor: string, rotation: number) => {
    const colorName = getColorName(hexColor);
    return `https://www.starkeypro.com/-/media/Project/Starkey/StarkeyMaster/products/360s/genesis-ai/mric-r/hearing-aid/${colorName}/${rotation}.jpg`;
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