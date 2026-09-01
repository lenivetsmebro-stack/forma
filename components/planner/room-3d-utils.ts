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
  type: "door" | "window";
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  wall: Room3DWall;
  offset: number;
  sillHeight: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

export type Room3DWall = "back" | "left" | "right";
export type Room3DCameraPreset = "perspective" | "top" | "cornerA" | "cornerB";

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

export interface Room3DOpeningSeed {
  id: string;
  type: "door" | "window";
  width: number;
  height: number;
  wall: Room3DWall;
}

function getParsedOpening(
  opening: PlannerOpening,
  type: "door" | "window",
  wall: Room3DWall,
): Room3DOpeningSeed | null {
  const width = parsePositiveNumber(opening.width);
  const height = parsePositiveNumber(opening.height);
  return width !== null && height !== null
    ? { id: opening.id, type, width, height, wall }
    : null;
}

function getWallSpan(wall: Room3DWall, width: number, length: number): number {
  return wall === "back" ? width : length;
}

export function getWallOpeningPositions(
  openings: Room3DOpeningSeed[],
  wall: Room3DWall,
  roomWidth: number,
  roomLength: number,
  roomHeight: number,
): Room3DOpeningModel[] {
  const wallOpenings = openings.filter((opening) => opening.wall === wall);
  const wallSpan = getWallSpan(wall, roomWidth, roomLength);
  const slotWidth = wallSpan / Math.max(1, wallOpenings.length);
  const previewGap = Math.min(0.1, slotWidth * 0.1);

  return wallOpenings.flatMap((opening, index) => {
    const width = Math.min(opening.width, Math.max(0.001, slotWidth - previewGap * 2));
    const maxHeight = opening.type === "door"
      ? Math.max(0.001, roomHeight - Math.min(0.05, roomHeight * 0.02))
      : Math.max(0.001, roomHeight - Math.min(0.2, roomHeight * 0.08));
    const height = Math.min(opening.height, maxHeight);
    if (![width, height].every((value) => Number.isFinite(value) && value > 0)) return [];

    const offset = -wallSpan / 2 + slotWidth * (index + 0.5);
    const sillHeight = opening.type === "door"
      ? 0
      : Math.min(0.9, Math.max(0, roomHeight - height - Math.min(0.1, roomHeight * 0.04)));
    const centerY = sillHeight + height / 2;
    const wallInset = 0.012;
    const centerX = wall === "back" ? offset : wall === "left" ? -roomWidth / 2 + wallInset : roomWidth / 2 - wallInset;
    const centerZ = wall === "back" ? -roomLength / 2 + wallInset : offset;

    return [{
      id: opening.id,
      type: opening.type,
      width,
      height,
      sourceWidth: opening.width,
      sourceHeight: opening.height,
      wall,
      offset,
      sillHeight,
      centerX,
      centerY,
      centerZ,
    }];
  });
}

export function getRoom3DOpeningPlacements(
  roomWidth: number,
  roomLength: number,
  roomHeight: number,
  doors: PlannerOpening[],
  windows: PlannerOpening[],
): Room3DOpeningModel[] {
  const parsed = [
    ...doors.flatMap((opening, index) => {
      const model = getParsedOpening(opening, "door", index % 2 === 0 ? "back" : "left");
      return model ? [model] : [];
    }),
    ...windows.flatMap((opening, index) => {
      const model = getParsedOpening(opening, "window", index % 2 === 0 ? "left" : "back");
      return model ? [model] : [];
    }),
  ];

  return (["back", "left"] as const).flatMap((wall) =>
    getWallOpeningPositions(parsed, wall, roomWidth, roomLength, roomHeight),
  );
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

  const openingPlacements = getRoom3DOpeningPlacements(
    width,
    length,
    height,
    room.doors,
    room.windows,
  );

  return {
    roomId: room.id,
    roomName: designSpecification.roomName,
    width,
    length,
    height,
    doors: openingPlacements.filter((opening) => opening.type === "door"),
    windows: openingPlacements.filter((opening) => opening.type === "window"),
    designSpecification,
  };
}

export function getVisibleRoomWalls(preset: Room3DCameraPreset): Room3DWall[] {
  if (preset === "cornerB") return ["back", "right"];
  if (preset === "top") return ["back", "left", "right"];
  return ["back", "left"];
}

export function getRoom3DCameraPreset(
  model: Room3DModel,
  preset: Room3DCameraPreset,
) {
  const span = Math.max(model.width, model.length, model.height);
  const positions: Record<Room3DCameraPreset, [number, number, number]> = {
    perspective: [model.width / 2 + span * 0.62, model.height * 0.72, model.length / 2 + span * 0.7],
    top: [0, model.height + span * 1.55, span * 0.001],
    cornerA: [model.width / 2 + span * 0.9, model.height * 0.68, model.length / 2 + span * 0.42],
    cornerB: [-model.width / 2 - span * 0.78, model.height * 0.7, model.length / 2 + span * 0.58],
  };
  const position = positions[preset];
  const target: [number, number, number] = preset === "top"
    ? [0, 0, 0]
    : [0, model.height * 0.42, 0];
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
    fov: preset === "top" ? 38 : 42,
  };
}

export function getRoom3DCamera(model: Room3DModel) {
  return getRoom3DCameraPreset(model, "perspective");
}

export function formatRoom3DDimension(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
