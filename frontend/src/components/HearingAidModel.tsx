import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface HearingAidModelProps {
  color: string;
}

const Model: React.FC<{ color: string }> = ({ color }) => {
  const { scene } = useGLTF('/models/hearing-aid-model.glb');

  // Clone the scene to avoid modifying the cached original
  const clonedScene = scene.clone();

  // Apply the color to all meshes in the scene
  clonedScene.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.3,
        metalness: 0.7,
      });
    }
  });

  return <primitive object={clonedScene} scale={0.8} rotation={[0, Math.PI / 4, 0]} />;
};

const HearingAidViewer: React.FC<HearingAidModelProps> = ({ color }) => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas 
        camera={{ 
          position: [0, 0, 0.2], 
          near: 0.025, 
          far: 22, 
          fov: 20 
        }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <spotLight
          position={[-10, 10, -10]}
          angle={0.3}
          penumbra={1}
          intensity={1.2}
          castShadow
        />
        <group>
          <Model color={color} />
        </group>
        <OrbitControls
          enableZoom={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate
          autoRotateSpeed={1}
        />
      </Canvas>
    </div>
  );
};

// Pre-load the model
useGLTF.preload('/models/hearing-aid-model.glb');

export default HearingAidViewer; 