import type {
  PlannerOpening,
  PlannerRoom,
  RoomType,
} from "@/components/planner/types";

export const AREA_TOLERANCE = 0.1;

export type AreaDistributionStatus = "UNDER" | "MATCHED" | "OVER";

export const roomTypeOptions: Array<{ value: RoomType; label: string }> = [
  { value: "living-room", label: "Гостиная" },
  { value: "kitchen", label: "Кухня" },
  { value: "bedroom", label: "Спальня" },
  { value: "bathroom", label: "Ванная" },
  { value: "children", label: "Детская" },
  { value: "office", label: "Кабинет" },
  { value: "hallway", label: "Коридор" },
  { value: "wardrobe", label: "Гардеробная" },
  { value: "utility", label: "Хоз. помещение" },
  { value: "other", label: "Другое" },
];

export function parsePositiveNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function calculateRoomArea(room: PlannerRoom): number {
  return calculateRoomFloorArea(room);
}

export function calculateRoomFloorArea(room: PlannerRoom): number {
  const length = parsePositiveNumber(room.length);
  const width = parsePositiveNumber(room.width);
  return length !== null && width !== null ? length * width : 0;
}

export function calculateRoomCeilingArea(room: PlannerRoom): number {
  return calculateRoomFloorArea(room);
}

export function calculateRoomPerimeter(room: PlannerRoom): number {
  const length = parsePositiveNumber(room.length);
  const width = parsePositiveNumber(room.width);
  return length !== null && width !== null ? 2 * (length + width) : 0;
}

export function calculateGrossWallArea(room: PlannerRoom): number {
  const height = parsePositiveNumber(room.height);
  return height !== null ? calculateRoomPerimeter(room) * height : 0;
}

export function calculateOpeningArea(opening: PlannerOpening): number {
  const width = parsePositiveNumber(opening.width);
  const height = parsePositiveNumber(opening.height);
  return width !== null && height !== null ? width * height : 0;
}

export function calculateOpeningsArea(openings: PlannerOpening[]): number {
  return openings.reduce(
    (total, opening) => total + calculateOpeningArea(opening),
    0,
  );
}

export function calculateRoomOpeningsArea(room: PlannerRoom): number {
  return calculateOpeningsArea(room.doors) + calculateOpeningsArea(room.windows);
}

export function calculateNetWallArea(room: PlannerRoom): number {
  return Math.max(0, calculateGrossWallArea(room) - calculateRoomOpeningsArea(room));
}

export function areRoomOpeningsValid(room: PlannerRoom): boolean {
  return calculateRoomOpeningsArea(room) <= calculateGrossWallArea(room);
}

export function isOpeningValid(opening: PlannerOpening): boolean {
  return (
    parsePositiveNumber(opening.width) !== null &&
    parsePositiveNumber(opening.height) !== null
  );
}

export function calculateRoomsTotalArea(rooms: PlannerRoom[]): number {
  return rooms.reduce((total, room) => total + calculateRoomArea(room), 0);
}

export function calculateTotalFloorArea(rooms: PlannerRoom[]): number {
  return rooms.reduce((total, room) => total + calculateRoomFloorArea(room), 0);
}

export function calculateTotalCeilingArea(rooms: PlannerRoom[]): number {
  return rooms.reduce((total, room) => total + calculateRoomCeilingArea(room), 0);
}

export function calculateTotalGrossWallArea(rooms: PlannerRoom[]): number {
  return rooms.reduce((total, room) => total + calculateGrossWallArea(room), 0);
}

export function calculateTotalDoorArea(rooms: PlannerRoom[]): number {
  return rooms.reduce(
    (total, room) => total + calculateOpeningsArea(room.doors),
    0,
  );
}

export function calculateTotalWindowArea(rooms: PlannerRoom[]): number {
  return rooms.reduce(
    (total, room) => total + calculateOpeningsArea(room.windows),
    0,
  );
}

export function calculateTotalNetWallArea(rooms: PlannerRoom[]): number {
  return rooms.reduce((total, room) => total + calculateNetWallArea(room), 0);
}

export function calculateAreaDifference(
  objectArea: number,
  roomsTotalArea: number,
): number {
  return objectArea - roomsTotalArea;
}

export function isAreaMatched(
  objectArea: number,
  roomsTotalArea: number,
): boolean {
  if (
    !Number.isFinite(objectArea) ||
    !Number.isFinite(roomsTotalArea) ||
    objectArea <= 0 ||
    roomsTotalArea < 0
  ) {
    return false;
  }
  return Math.abs(calculateAreaDifference(objectArea, roomsTotalArea)) <= AREA_TOLERANCE;
}

/** Rooms may sum to less than the object area (walls, corridors, unlisted
 * spaces), but must not exceed it by more than this share. */
export const AREA_OVERFLOW_LIMIT = 0.03;

export function isAreaWithinLimit(objectArea: number, roomsTotalArea: number): boolean {
  if (!Number.isFinite(objectArea) || !Number.isFinite(roomsTotalArea) || objectArea <= 0 || roomsTotalArea <= 0) {
    return false;
  }
  return roomsTotalArea <= objectArea * (1 + AREA_OVERFLOW_LIMIT) + AREA_TOLERANCE;
}

export function calculateAreaCompletionPercent(
  objectArea: number,
  roomsTotalArea: number,
): number {
  if (
    !Number.isFinite(objectArea) ||
    !Number.isFinite(roomsTotalArea) ||
    objectArea <= 0 ||
    roomsTotalArea < 0
  ) {
    return 0;
  }
  return (roomsTotalArea / objectArea) * 100;
}

export function getAreaDistributionStatus(
  objectArea: number,
  roomsTotalArea: number,
): AreaDistributionStatus {
  if (isAreaMatched(objectArea, roomsTotalArea)) return "MATCHED";
  return roomsTotalArea < objectArea - AREA_TOLERANCE ? "UNDER" : "OVER";
}

export function isRoomValid(room: PlannerRoom): boolean {
  return (
    room.type !== "" &&
    (room.type !== "other" || room.customName.trim() !== "") &&
    parsePositiveNumber(room.length) !== null &&
    parsePositiveNumber(room.width) !== null &&
    parsePositiveNumber(room.height) !== null
  );
}

export function getRoomName(room: PlannerRoom, index: number): string {
  if (room.type === "other" && room.customName.trim()) return room.customName.trim();
  return roomTypeOptions.find((option) => option.value === room.type)?.label ?? `Помещение ${index + 1}`;
}

export function formatArea(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
}

export function formatLength(value: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
}
