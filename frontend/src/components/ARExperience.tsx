import React, { useEffect, useState } from 'react';
import ARViewer from './ARViewer';
import { isIOS } from '../utils/arUtils';

interface ARExperienceProps {
  modelPath: string;
  usdzUrl?: string;
  color?: string;
}

export const ARExperience: React.FC<ARExperienceProps> = ({ modelPath, usdzUrl, color }) => {
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    setIsIOSDevice(isIOS());
  }, []);

  // For iOS devices, just show the image with a link to the USDZ file
  if (isIOSDevice && usdzUrl) {
    return (
      <div className="ar-quicklook">
        <a href={usdzUrl} rel="ar">
          <img 
            src="/images/hearing-aid-preview.jpg" 
            alt="Hearing Aid" 
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </a>
        <div className="ar-instructions">
          <h3>How to use AR on iOS:</h3>
          <p>Tap the image above to view the hearing aid in AR</p>
        </div>
      </div>
    );
  }

  // For all other devices, use the ARViewer component
  return (
    <div className="ar-viewer-container">
      <ARViewer modelPath={modelPath} color={color} />
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