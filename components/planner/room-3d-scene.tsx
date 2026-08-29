"use client";

import { Canvas } from "@react-three/fiber";

import type { Room3DModel } from "@/components/planner/room-3d-utils";
import { getRoom3DCamera } from "@/components/planner/room-3d-utils";

type Room3DSceneProps = { model: Room3DModel };

// Three.js material side enum: FrontSide = 0, BackSide = 1, DoubleSide = 2.
const DOUBLE_SIDE = 2;

function RoomGeometry({ model }: Room3DSceneProps) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[model.width, model.length]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.95} side={DOUBLE_SIDE} />
      </mesh>

      <mesh position={[0, model.height / 2, -model.length / 2]}>
        <planeGeometry args={[model.width, model.height]} />
        <meshStandardMaterial color="#d7d1c7" roughness={0.92} side={DOUBLE_SIDE} />
      </mesh>
      <mesh position={[-model.width / 2, model.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[model.length, model.height]} />
        <meshStandardMaterial color="#d7d1c7" roughness={0.92} side={DOUBLE_SIDE} />
      </mesh>
    </group>
  );
}

export function Room3DScene({ model }: Room3DSceneProps) {
  const camera = getRoom3DCamera(model);
  return (
    <Canvas
      aria-label={`3D preview комнаты ${model.roomName}`}
      camera={{ position: camera.position, rotation: camera.rotation, fov: camera.fov, near: camera.near, far: camera.far }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      shadows
    >
      <color attach="background" args={["#f1ede5"]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[model.width, model.height * 2, model.length]} intensity={1.8} castShadow />
      <RoomGeometry model={model} />
    </Canvas>
  );
}
