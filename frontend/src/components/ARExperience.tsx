import React, { useEffect, useState } from 'react';
import ARViewer from './ARViewer';
import { getARExperienceType } from '../utils/arUtils';

interface ARExperienceProps {
  modelPath: string;
  usdzUrl?: string;
  color?: string;
}

export const ARExperience: React.FC<ARExperienceProps> = ({ modelPath, usdzUrl, color }) => {
  const [arType, setArType] = useState<'webxr' | 'quicklook' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkARSupport = async () => {
      try {
        const type = await getARExperienceType();
        setArType(type);
      } catch (err) {
        console.error('Error checking AR support:', err);
        setError('Failed to check AR support');
      }
    };

    checkARSupport();
  }, []);

  const handleQuickLook = () => {
    if (!usdzUrl) {
      setError('USDZ model not available for Quick Look');
      return;
    }

    // Create a temporary anchor element to trigger Quick Look
    const anchor = document.createElement('a');
    anchor.setAttribute('rel', 'ar');
    anchor.setAttribute('href', usdzUrl);
    anchor.click();
  };

  if (error) {
    return (
      <div className="ar-error">
        <p>{error}</p>
        <p>Please try a different browser or device that supports AR.</p>
      </div>
    );
  }

  if (arType === 'none') {
    return (
      <div className="ar-error">
        <p>AR is not supported on this device or browser.</p>
        <p>Please try a different browser or device that supports AR.</p>
      </div>
    );
  }

  if (arType === 'quicklook') {
    return (
      <div className="ar-quicklook">
        <ARViewer modelPath={modelPath} />
        <button 
          onClick={handleQuickLook}
          className="quicklook-button"
          disabled={!usdzUrl}
        >
          View in AR
        </button>
        {!usdzUrl && (
          <p className="quicklook-warning">
            USDZ model not available for Quick Look. Please contact support.
          </p>
        )}
      </div>
    );
  }

  return <ARViewer modelPath={modelPath} />;
}; 