import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ExplosionEffectProps {
  position: [number, number, number];
}

export default function ExplosionEffect({ position }: ExplosionEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const [visible, setVisible] = useState(true);

  // Particle positions — burst outward
  const particleCount = 20;
  const velocities = useRef<Float32Array | undefined>(undefined);
  if (!velocities.current) {
    velocities.current = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      velocities.current[i * 3] = (Math.random() - 0.5) * 2;
      velocities.current[i * 3 + 1] = Math.random() * 2;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
  }

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const dummy = useRef(new THREE.Object3D());

  useFrame((_, delta) => {
    if (!visible) return;
    elapsed.current += delta;
    const t = elapsed.current;

    if (t > 2.5) {
      setVisible(false);
      return;
    }

    // Flash sphere — bright then fade
    if (flashRef.current) {
      const flashScale = t < 0.1 ? t * 10 : Math.max(0, 1 - (t - 0.1) * 2);
      flashRef.current.scale.setScalar(flashScale * 0.5);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t * 2);
    }

    // Particles burst outward
    if (meshRef.current && velocities.current) {
      for (let i = 0; i < particleCount; i++) {
        const vx = velocities.current[i * 3];
        const vy = velocities.current[i * 3 + 1];
        const vz = velocities.current[i * 3 + 2];
        dummy.current.position.set(vx * t, vy * t - 0.5 * t * t, vz * t); // gravity
        dummy.current.scale.setScalar(Math.max(0, 1 - t * 0.5));
        dummy.current.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.current.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Camera shake
    if (groupRef.current && t < 1) {
      const shake = Math.max(0, (1 - t)) * 0.05;
      groupRef.current.position.x = (Math.random() - 0.5) * shake;
      groupRef.current.position.y = (Math.random() - 0.5) * shake;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Bright flash */}
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} />
      </mesh>

      {/* Orange fireball */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.6} />
      </mesh>

      {/* Particle burst */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshBasicMaterial color="#ff4400" />
      </instancedMesh>

      {/* Point light for illumination */}
      <pointLight color="#ff6600" intensity={5} distance={3} decay={2} />
    </group>
  );
}
