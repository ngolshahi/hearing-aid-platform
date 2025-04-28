import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';

// Define proper types for WebXR API
interface XRSession extends EventTarget {
  requestHitTestSource(options: { space: XRSpace }): Promise<XRHitTestSource>;
}

interface XRSpace {
  // Add properties as needed
}

interface XRHitTestSource {
  cancel(): void;
}

// Define XRSessionMode type
type XRSessionMode = 'inline' | 'immersive-ar' | 'immersive-vr';

interface ARViewerProps {
  modelPath: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// Pre-load the model
useGLTF.preload('/models/hearing-aid-model.glb');

// Model component for React Three Fiber
const Model: React.FC<{
  modelPath: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
}> = ({ modelPath, scale, position, rotation }) => {
  const { scene } = useGLTF(modelPath);
  
  // Clone the scene to avoid modifying the cached original
  const clonedScene = scene.clone();
  
  return (
    <primitive 
      object={clonedScene} 
      scale={[scale, scale, scale]} 
      position={position} 
      rotation={rotation} 
    />
  );
};

// Define ARButton options type
interface ARButtonOptions {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
  domOverlay?: {
    root: HTMLElement;
  };
}

const ARViewer: React.FC<ARViewerProps> = ({
  modelPath,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arButton, setArButton] = useState<HTMLElement | null>(null);
  const [webXRSupported, setWebXRSupported] = useState<boolean>(false);
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    setIsSecureContext(window.isSecureContext);

    // Check if WebXR is supported
    const checkWebXRSupport = async () => {
      if (!window.isSecureContext) {
        setWebXRSupported(false);
        setError("WebXR requires a secure context (HTTPS). Please access this page via HTTPS.");
        setIsLoading(false);
        return;
      }

      if (!navigator.xr) {
        setWebXRSupported(false);
        setError("WebXR is not available in this browser. Please try using a modern browser like Chrome or Edge.");
        setIsLoading(false);
        return;
      }

      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        setWebXRSupported(supported);
        if (!supported) {
          setError("AR is not supported on this device. You can still view the 3D model below.");
        }
      } catch (err) {
        console.error("Error checking WebXR support:", err);
        setWebXRSupported(false);
        setError("Unable to check AR support. You can still view the 3D model below.");
      }
      setIsLoading(false);
    };

    checkWebXRSupport();

    if (!containerRef.current) return;

    // Only create AR button if WebXR is supported
    if (webXRSupported) {
      try {
        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.xr.enabled = true;

        // Create AR button with renderer and options
        const button = ARButton.createButton(renderer, {
          requiredFeatures: ['hit-test'],
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: containerRef.current }
        });
        
        containerRef.current.appendChild(button);
        setArButton(button);
      } catch (err) {
        console.error("Error creating AR button:", err);
        setError("Failed to initialize AR. You can still view the 3D model below.");
      }
    }

    // Cleanup
    return () => {
      if (containerRef.current && arButton) {
        containerRef.current.removeChild(arButton);
      }
    };
  }, [webXRSupported]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          Loading 3D model...
        </div>
      )}
      
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '10px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          {error}
          {!isSecureContext && (
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              To use AR, please access this page via HTTPS or localhost.
            </div>
          )}
        </div>
      )}
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[1, 1, 1]} intensity={0.8} />
        <Model 
          modelPath={modelPath} 
          scale={scale} 
          position={position} 
          rotation={rotation} 
        />
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          autoRotate={!webXRSupported}
          autoRotateSpeed={1}
        />
      </Canvas>
    </div>
  );
};

export default ARViewer; 