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

export type MaterialSurface = "floor" | "walls" | "ceiling";
export type MaterialUnit = "m2" | "package" | "liter" | "roll" | "kilogram" | "piece";
export type MaterialPriceUnit =
  | "package"
  | "m2"
  | "piece"
  | "roll"
  | "can"
  | "bag"
  | "linear-meter";
export type MaterialPriceSource = "demo-local" | "external";
export type WastePercent = 0 | 5 | 10 | 15;

export interface PlannerMaterialSelection {
  materialId: string;
  wastePercent: WastePercent;
}

export type PlannerRoomFinishes = Record<
  MaterialSurface,
  PlannerMaterialSelection
>;

export interface PlannerMaterialDefinition {
  id: string;
  surface: MaterialSurface;
  label: string;
  calculationUnit: MaterialUnit;
  coveragePerPackage?: number;
  pricing?: PlannerMaterialPricing;
  isNone?: boolean;
}

export interface PlannerMaterialPricing {
  price: number;
  priceUnit: MaterialPriceUnit;
  source: MaterialPriceSource;
  storeName?: string;
  productName?: string;
  productUrl?: string;
  updatedAt?: string;
}

export interface PlannerRoom {
  id: string;
  type: RoomType | "";
  customName: string;
  length: string;
  width: string;
  height: string;
  doors: PlannerOpening[];
  windows: PlannerOpening[];
  finishes: PlannerRoomFinishes;
}

export type DesignMode = "global" | "per-room";

export interface PlannerDesignData {
  mode: DesignMode;
  globalStyleId: string | null;
  roomStyleSelections: Record<string, string>;
}

export interface InteriorStyleColor {
  name: string;
  hex: string;
}

export interface InteriorStyleDefinition {
  id: string;
  name: string;
  shortDescription: string;
  palette: InteriorStyleColor[];
  materials: string[];
  mood: string[];
  keywords: string[];
}

export interface RoomDesignSpecification {
  roomId: string;
  roomName: string;
  styleId: string;
  styleName: string;
  palette: InteriorStyleColor[];
  materials: string[];
  mood: string[];
  keywords: string[];
}
