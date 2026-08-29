import { getRoomDesignSpecification } from "@/components/planner/design-utils";
import type {
  PlannerDesignData,
  PlannerOpening,
  PlannerRoom,
  RoomDesignSpecification,
} from "@/components/planner/types";
import { parsePositiveNumber } from "@/components/planner/planner-utils";

export interface Room3DOpeningModel {
  id: string;
  width: number;
  height: number;
}

export interface Room3DModel {
  roomId: string;
  roomName: string;
  width: number;
  length: number;
  height: number;
  doors: Room3DOpeningModel[];
  windows: Room3DOpeningModel[];
  designSpecification: RoomDesignSpecification;
}

// Coordinate system: X = room width, Y = height, Z = length.
// The floor is Y = 0, the ceiling is Y = height, and 1 scene unit = 1 metre.
// The room is centered on X/Z around the origin.
export const ROOM_3D_COORDINATE_SYSTEM = {
  x: "width",
  y: "height",
  z: "length",
  unit: "metre",
  floorY: 0,
} as const;

function getOpening3DModel(opening: PlannerOpening): Room3DOpeningModel | null {
  const width = parsePositiveNumber(opening.width);
  const height = parsePositiveNumber(opening.height);
  return width !== null && height !== null
    ? { id: opening.id, width, height }
    : null;
}

function getValidOpeningModels(openings: PlannerOpening[]): Room3DOpeningModel[] {
  return openings.flatMap((opening) => {
    const model = getOpening3DModel(opening);
    return model ? [model] : [];
  });
}

export function getRoom3DModel(
  room: PlannerRoom,
  roomIndex: number,
  design: PlannerDesignData,
): Room3DModel | null {
  const width = parsePositiveNumber(room.width);
  const length = parsePositiveNumber(room.length);
  const height = parsePositiveNumber(room.height);
  const designSpecification = getRoomDesignSpecification(room, roomIndex, design);

  if (width === null || length === null || height === null || !designSpecification) {
    return null;
  }

  return {
    roomId: room.id,
    roomName: designSpecification.roomName,
    width,
    length,
    height,
    doors: getValidOpeningModels(room.doors),
    windows: getValidOpeningModels(room.windows),
    designSpecification,
  };
}

export function getRoom3DCamera(model: Room3DModel) {
  const span = Math.max(model.width, model.length, model.height);
  const position: [number, number, number] = [
    model.width / 2 + span * 0.62,
    model.height * 0.72,
    model.length / 2 + span * 0.7,
  ];
  const target: [number, number, number] = [0, model.height * 0.42, 0];
  const direction = target.map((value, index) => value - position[index]) as [number, number, number];
  const distance = Math.hypot(...direction);
  const normalized = direction.map((value) => value / distance) as [number, number, number];
  return {
    position,
    target,
    rotation: [
      Math.asin(normalized[1]),
      Math.atan2(-normalized[0], -normalized[2]),
      0,
    ] as [number, number, number],
    near: Math.max(0.01, span / 1000),
    far: span * 20,
    fov: 42,
  };
}

export function formatRoom3DDimension(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
