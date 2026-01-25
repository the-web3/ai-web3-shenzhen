import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Market } from '../types';
import { calculateProbability } from '../services/chainService';

interface StarNodeProps {
  market: Market;
  onClick: (id: number) => void;
  isActive: boolean;
  isHovered: boolean; // From Dashboard hover
  position: [number, number, number];
}

const StarNode: React.FC<StarNodeProps> = ({ market, onClick, isActive, isHovered, position }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const outerRef = useRef<THREE.Mesh>(null!);
  
  const probYes = calculateProbability(market.yesPool, market.noPool);
  
  const color = useMemo(() => {
    const r = probYes < 0.5 ? 1 : (1 - probYes) * 2;
    const g = probYes > 0.5 ? 1 : probYes * 2;
    return new THREE.Color(r, g, 0.2);
  }, [probYes]);

  const totalLiq = market.yesPool + market.noPool;
  const baseSize = Math.min(Math.max(totalLiq / 10000, 1.5), 4.0);

  useFrame((state, delta) => {
    // Pulse effect
    if (isActive || isHovered) {
        meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, baseSize * 1.5, 0.1);
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, baseSize * 1.5, 0.1);
        meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, baseSize * 1.5, 0.1);
        
        // Rotate outer ring
        if (outerRef.current) {
            outerRef.current.rotation.z -= delta * 2;
            outerRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 5) * 0.1);
        }
    } else {
        meshRef.current.scale.setScalar(baseSize);
        meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Targeting Reticle (Visible on Hover/Active) */}
      {(isActive || isHovered) && (
        <group>
            {/* Connection Line to 'Ground' or center to imply tracking */}
            <Line points={[[0,0,0], [0, -10, 0]]} color={isHovered ? "#00ffcc" : "white"} opacity={0.2} transparent lineWidth={1} />
            
            {/* Rotating Ring */}
            <mesh ref={outerRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[baseSize * 1.2, baseSize * 1.3, 32]} />
                <meshBasicMaterial color={isHovered ? "#00ffcc" : "white"} transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
        </group>
      )}

      <Trail width={0.2} length={4} color={color} decay={2} attenuation={(t) => t * t}>
         <mesh 
            ref={meshRef} 
            onClick={(e) => { e.stopPropagation(); onClick(market.id); }}
        >
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial 
                emissive={color} 
                emissiveIntensity={isActive || isHovered ? 4 : 1.5} 
                color={color} 
                roughness={0.2}
            />
        </mesh>
      </Trail>
      
      {/* Floating Label: Always visible if hovered, otherwise only if close or active */}
      <Text
        position={[0, baseSize + 1.5, 0]}
        fontSize={isActive || isHovered ? 0.8 : 0.5}
        color={isActive || isHovered ? "#00ffcc" : "#aaaaaa"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={isHovered ? 0.05 : 0}
        outlineColor="#000000"
      >
        {market.title}
        {(isActive || isHovered) && `\n${(probYes * 100).toFixed(1)}%`}
      </Text>
    </group>
  );
};

interface TruthUniverseProps {
  markets: Market[];
  activeMarketId: number | null;
  hoveredMarketId: number | null; // New Prop
  onMarketSelect: (id: number | null) => void;
}

const TruthUniverse: React.FC<TruthUniverseProps> = ({ markets, activeMarketId, hoveredMarketId, onMarketSelect }) => {
  // Filter out resolved and cancelled markets for 3D display
  const activeMarkets = useMemo(() => markets.filter(m => !m.resolved && !m.cancelled), [markets]);
  
  const positions = useMemo(() => {
    return activeMarkets.map((_, i) => {
        const theta = i * 2.39996;
        const radius = 8 + i * 2;
        const x = radius * Math.cos(theta);
        const y = (Math.random() - 0.5) * 8; // Flattened slightly
        const z = radius * Math.sin(theta);
        return [x, y, z] as [number, number, number];
    });
  }, [activeMarkets.length]);

  return (
    <div className="absolute inset-0 z-0 bg-slate-950 transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 5, 25], fov: 50 }}>
        <fog attach="fog" args={['#050505', 10, 50]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        
        {activeMarkets.map((market, i) => (
          <StarNode 
            key={market.id} 
            market={market} 
            position={positions[i]}
            isActive={activeMarketId === market.id}
            isHovered={hoveredMarketId === market.id}
            onClick={onMarketSelect}
          />
        ))}

        <OrbitControls 
            enablePan={false} 
            autoRotate={!activeMarketId && !hoveredMarketId} 
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
        />
        
        {/* Click background to deselect */}
        <mesh visible={false} onClick={() => onMarketSelect(null)} scale={100}>
            <sphereGeometry />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Canvas>
    </div>
  );
};

export default TruthUniverse;
