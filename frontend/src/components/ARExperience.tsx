import React, { useEffect, useState } from 'react';
import ARViewer from './ARViewer';
import { getARExperienceType, isIOS } from '../utils/arUtils';

interface ARExperienceProps {
  modelPath: string;
  usdzUrl?: string;
  color?: string;
}

export const ARExperience: React.FC<ARExperienceProps> = ({ modelPath, usdzUrl, color }) => {
  const [arType, setArType] = useState<'webxr' | 'quicklook' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    const checkARSupport = async () => {
      try {
        const type = await getARExperienceType();
        setArType(type);
        setIsIOSDevice(isIOS());
      } catch (err) {
        console.error('Error checking AR support:', err);
        setError('Failed to check AR support');
      }
    };

    checkARSupport();
  }, []);

  if (error) {
    return (
      <div className="ar-error">
        <h3>Error</h3>
        <p>{error}</p>
        <p>Please try a different browser or device that supports AR.</p>
      </div>
    );
  }

  if (arType === 'none') {
    return (
      <div className="ar-fallback">
        <h3>AR Not Supported</h3>
        <p>Your device or browser doesn't support AR experiences. You can still view the 3D model below.</p>
        <ARViewer modelPath={modelPath} color={color} />
      </div>
    );
  }

  if (arType === 'quicklook') {
    return (
      <div className="ar-quicklook">
        <ARViewer modelPath={modelPath} color={color} />
        
        {usdzUrl ? (
          <a 
            href={usdzUrl} 
            rel="ar" 
            className="quicklook-button"
          >
            View in AR
          </a>
        ) : (
          <p className="quicklook-warning">
            USDZ model not available for Quick Look. Please contact support.
          </p>
        )}
        
        <div className="ar-instructions">
          <h3>How to use AR on iOS:</h3>
          <ol>
            <li>Tap the "View in AR" button above</li>
            <li>Allow camera access when prompted</li>
            <li>Point your camera at a flat surface</li>
            <li>Tap the screen to place the hearing aid</li>
            <li>Move around to view from different angles</li>
            <li>Use one finger to rotate, two fingers to scale</li>
          </ol>
        </div>
      </div>
    );
  }

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