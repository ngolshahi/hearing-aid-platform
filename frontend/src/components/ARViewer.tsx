import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

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

  useEffect(() => {
    if (!containerRef.current) return;

    // Create AR button
    const button = ARButton.createButton({
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: containerRef.current }
    } as any); // Use type assertion to bypass type checking
    
    containerRef.current.appendChild(button);
    setArButton(button);
    setIsLoading(false);

    // Cleanup
    return () => {
      if (containerRef.current && button) {
        containerRef.current.removeChild(button);
      }
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      {isLoading && <div>Loading AR experience...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {/* 
        Note: We're using the ARButton for XR functionality instead of the Canvas xr prop
        because the ARButton provides more control over the AR experience.
      */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[1, 1, 1]} intensity={0.8} />
        <Model 
          modelPath={modelPath} 
          scale={scale} 
          position={position} 
          rotation={rotation} 
        />
      </Canvas>
    </div>
  );
};

export default ARViewer; 