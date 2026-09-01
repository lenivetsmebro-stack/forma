"use client";

import { Canvas } from "@react-three/fiber";

import type {
  Room3DCameraPreset,
  Room3DModel,
  Room3DOpeningModel,
  Room3DWall,
} from "@/components/planner/room-3d-utils";
import {
  getRoom3DCameraPreset,
  getVisibleRoomWalls,
} from "@/components/planner/room-3d-utils";

type Room3DSceneProps = { model: Room3DModel; preset: Room3DCameraPreset };

// Three.js material side enum: FrontSide = 0, BackSide = 1, DoubleSide = 2.
const DOUBLE_SIDE = 2;

function Wall({ model, wall }: { model: Room3DModel; wall: Room3DWall }) {
  if (wall === "back") {
    return (
      <mesh position={[0, model.height / 2, -model.length / 2]}>
        <planeGeometry args={[model.width, model.height]} />
        <meshStandardMaterial color="#d7d1c7" roughness={0.92} side={DOUBLE_SIDE} />
      </mesh>
    );
  }
  const x = wall === "left" ? -model.width / 2 : model.width / 2;
  const rotationY = wall === "left" ? Math.PI / 2 : -Math.PI / 2;
  return (
    <mesh position={[x, model.height / 2, 0]} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[model.length, model.height]} />
      <meshStandardMaterial color="#d7d1c7" roughness={0.92} side={DOUBLE_SIDE} />
    </mesh>
  );
}

function OpeningPreview({ opening }: { opening: Room3DOpeningModel }) {
  const onBackWall = opening.wall === "back";
  const frameHeight = opening.type === "door" ? opening.height : opening.height + 0.08;
  const frameSize: [number, number, number] = onBackWall
    ? [opening.width + 0.08, frameHeight, 0.035]
    : [0.035, frameHeight, opening.width + 0.08];
  const panelSize: [number, number, number] = onBackWall
    ? [opening.width, opening.height, 0.045]
    : [0.045, opening.height, opening.width];
  const position: [number, number, number] = [opening.centerX, opening.centerY, opening.centerZ];
  const panelPosition: [number, number, number] = [
    opening.centerX + (opening.wall === "left" ? 0.012 : opening.wall === "right" ? -0.012 : 0),
    opening.centerY,
    opening.centerZ + (opening.wall === "back" ? 0.012 : 0),
  ];
  const panelColor = opening.type === "door" ? "#726b62" : "#d9e1df";

  return (
    <group>
      <mesh position={panelPosition}>
        <boxGeometry args={frameSize} />
        <meshStandardMaterial color="#3d3a36" roughness={0.82} />
      </mesh>
      <mesh position={position}>
        <boxGeometry args={panelSize} />
        <meshStandardMaterial color={panelColor} roughness={opening.type === "door" ? 0.8 : 0.35} metalness={opening.type === "window" ? 0.12 : 0} />
      </mesh>
    </group>
  );
}

function TopOpeningMarker({ opening }: { opening: Room3DOpeningModel }) {
  const onBackWall = opening.wall === "back";
  const markerSize: [number, number, number] = onBackWall
    ? [opening.width, 0.045, 0.1]
    : [0.1, 0.045, opening.width];
  return (
    <mesh position={[opening.centerX, 0.045, opening.centerZ]}>
      <boxGeometry args={markerSize} />
      <meshStandardMaterial
        color={opening.type === "door" ? "#726b62" : "#a9c1c0"}
        roughness={0.72}
      />
    </mesh>
  );
}

function TopPlan({ model }: { model: Room3DModel }) {
  const perimeterThickness = 0.045;
  const perimeterHeight = 0.025;
  return (
    <group>
      <mesh position={[0, perimeterHeight / 2, -model.length / 2]}>
        <boxGeometry args={[model.width, perimeterHeight, perimeterThickness]} />
        <meshStandardMaterial color="#4a4742" roughness={0.86} />
      </mesh>
      <mesh position={[0, perimeterHeight / 2, model.length / 2]}>
        <boxGeometry args={[model.width, perimeterHeight, perimeterThickness]} />
        <meshStandardMaterial color="#4a4742" roughness={0.86} />
      </mesh>
      <mesh position={[-model.width / 2, perimeterHeight / 2, 0]}>
        <boxGeometry args={[perimeterThickness, perimeterHeight, model.length]} />
        <meshStandardMaterial color="#4a4742" roughness={0.86} />
      </mesh>
      <mesh position={[model.width / 2, perimeterHeight / 2, 0]}>
        <boxGeometry args={[perimeterThickness, perimeterHeight, model.length]} />
        <meshStandardMaterial color="#4a4742" roughness={0.86} />
      </mesh>
      {[...model.doors, ...model.windows].map((opening) => (
        <TopOpeningMarker key={opening.id} opening={opening} />
      ))}
    </group>
  );
}

function RoomGeometry({ model, preset }: Room3DSceneProps) {
  const visibleWalls = getVisibleRoomWalls(preset);
  const visibleOpenings = [...model.doors, ...model.windows].filter(
    (opening) => visibleWalls.includes(opening.wall),
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[model.width, model.length]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.95} side={DOUBLE_SIDE} />
      </mesh>

      {preset === "top" ? (
        <TopPlan model={model} />
      ) : (
        <>
          {visibleWalls.map((wall) => <Wall key={wall} model={model} wall={wall} />)}
          {visibleOpenings.map((opening) => <OpeningPreview key={opening.id} opening={opening} />)}
        </>
      )}
    </group>
  );
}

export function Room3DScene({ model, preset }: Room3DSceneProps) {
  const camera = getRoom3DCameraPreset(model, preset);
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
      <RoomGeometry model={model} preset={preset} />
    </Canvas>
  );
}
