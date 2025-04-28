import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

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

const ARViewer: React.FC<ARViewerProps> = ({
  modelPath,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Add AR button
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: containerRef.current }
    });
    containerRef.current.appendChild(arButton);

    // Add event listener for AR session start
    renderer.xr.addEventListener('sessionstart', () => {
      requestHitTest();
    });

    // Add event listener for AR session end
    renderer.xr.addEventListener('sessionend', () => {
      if (hitTestSource) {
        hitTestSource.cancel();
        hitTestSource = null;
      }
      hitTestSourceRequested = false;
    });

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Initialize hit testing
    let hitTestSourceRequested = false;
    let hitTestSource: XRHitTestSource | null = null;

    // Load 3D model
    const loader = new GLTFLoader();
    let model: THREE.Group | null = null;

    loader.load(
      modelPath,
      (gltf) => {
        model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(...position);
        model.rotation.set(...rotation);
        scene.add(model);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        setError('Failed to load 3D model');
        setIsLoading(false);
      }
    );

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      renderer.setAnimationLoop(() => {
        if (renderer.xr.isPresenting) {
          // Get hit test results
          const referenceSpace = renderer.xr.getReferenceSpace();
          if (referenceSpace && hitTestSource) {
            const frame = renderer.xr.getFrame();
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);
              
              if (pose && model) {
                // Update model position based on hit test
                model.matrix.fromArray(pose.transform.matrix);
                model.matrix.decompose(model.position, model.quaternion, model.scale);
              }
            }
          }
        }
        renderer.render(scene, camera);
      });
    };

    // Request hit testing
    const requestHitTest = async () => {
      if (hitTestSourceRequested) return;
      
      const session = renderer.xr.getSession();
      if (session && 'requestHitTestSource' in session) {
        try {
          hitTestSourceRequested = true;
          const xrSession = session as XRSession;
          const newHitTestSource = await xrSession.requestHitTestSource({
            space: renderer.xr.getReferenceSpace() as XRSpace
          });
          if (newHitTestSource) {
            hitTestSource = newHitTestSource;
          }
        } catch (error) {
          console.error('Error requesting hit test source:', error);
          hitTestSourceRequested = false;
        }
      }
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        containerRef.current.removeChild(arButton);
      }
    };
  }, [modelPath, scale, position, rotation]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      {isLoading && <div>Loading AR experience...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default ARViewer; 