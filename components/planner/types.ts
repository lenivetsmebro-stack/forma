export type PropertyType = "apartment" | "house";

export interface PlannerObjectData {
  propertyType: PropertyType | null;
  totalArea: number | null;
  roomCount: number | null;
  ceilingHeight: number | null;
  floorCount: number | null;
}

export type RoomType =
  | "living-room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "children"
  | "office"
  | "hallway"
  | "wardrobe"
  | "utility"
  | "other";

export interface PlannerOpening {
  id: string;
  width: string;
  height: string;
}

export type PlannerOpeningKind = "doors" | "windows";

export interface PlannerRoom {
  id: string;
  type: RoomType | "";
  customName: string;
  length: string;
  width: string;
  height: string;
  doors: PlannerOpening[];
  windows: PlannerOpening[];
}
