import { getMaterialById } from "@/components/planner/material-catalog";
import type {
  MaterialSurface,
  PlannerMaterialDefinition,
  PlannerMaterialSelection,
  PlannerRoom,
  WastePercent,
} from "@/components/planner/types";
import {
  calculateNetWallArea,
  calculateRoomCeilingArea,
  calculateRoomFloorArea,
  getRoomName,
  areRoomOpeningsValid,
  isOpeningValid,
} from "@/components/planner/planner-utils";

export interface MaterialCalculation {
  baseArea: number;
  requiredArea: number;
  packages: number | null;
  purchasedArea: number | null;
}

export interface MaterialRoomRequirement extends MaterialCalculation {
  roomId: string;
  roomName: string;
  wastePercent: WastePercent;
  totalCost: number | null;
}

export interface MaterialAggregate extends MaterialCalculation {
  materialId: string;
  surface: MaterialSurface;
  roomCount: number;
  wastePercents: WastePercent[];
  rooms: MaterialRoomRequirement[];
  totalCost: number | null;
}

export interface MaterialScheduleSummary {
  selectedCount: number;
  purchasePositionCount: number;
  requiredAreaBySurface: Record<MaterialSurface, number>;
  costBySurface: Record<MaterialSurface, number>;
  totalCost: number;
}

export const DEFAULT_WASTE_PERCENT: WastePercent = 10;
export const wasteOptions: WastePercent[] = [0, 5, 10, 15];

export function createDefaultRoomFinishes() {
  return {
    floor: { materialId: "", wastePercent: DEFAULT_WASTE_PERCENT },
    walls: { materialId: "", wastePercent: DEFAULT_WASTE_PERCENT },
    ceiling: { materialId: "", wastePercent: DEFAULT_WASTE_PERCENT },
  };
}

export function calculateRequiredArea(
  surfaceArea: number,
  wastePercent: WastePercent,
): number {
  if (!Number.isFinite(surfaceArea) || surfaceArea <= 0) return 0;
  return surfaceArea * (1 + wastePercent / 100);
}

export function calculatePackageRequirement(
  requiredArea: number,
  coveragePerPackage?: number,
) {
  if (
    !Number.isFinite(requiredArea) ||
    requiredArea <= 0 ||
    coveragePerPackage === undefined ||
    !Number.isFinite(coveragePerPackage) ||
    coveragePerPackage <= 0
  ) {
    return { packages: null, purchasedArea: null };
  }
  const packages = Math.ceil(requiredArea / coveragePerPackage);
  return { packages, purchasedArea: packages * coveragePerPackage };
}

export function getRoomSurfaceArea(room: PlannerRoom, surface: MaterialSurface) {
  if (surface === "floor") return calculateRoomFloorArea(room);
  if (surface === "ceiling") return calculateRoomCeilingArea(room);
  return calculateNetWallArea(room);
}

export function calculateMaterialRequirement(
  surfaceArea: number,
  selection: PlannerMaterialSelection,
): MaterialCalculation {
  const material = getMaterialById(selection.materialId);
  const baseArea = material?.isNone ? 0 : surfaceArea;
  const requiredArea = calculateRequiredArea(baseArea, selection.wastePercent);
  return {
    baseArea,
    requiredArea,
    ...calculatePackageRequirement(requiredArea, material?.coveragePerPackage),
  };
}

export function calculateMaterialCost(
  calculation: MaterialCalculation,
  material?: PlannerMaterialDefinition,
  requiredUnits?: number,
): number | null {
  const pricing = material?.pricing;
  if (
    !pricing ||
    !Number.isFinite(pricing.price) ||
    pricing.price <= 0
  ) {
    return null;
  }

  let quantity: number | null = null;
  if (pricing.priceUnit === "package") quantity = calculation.packages;
  if (pricing.priceUnit === "m2") quantity = calculation.requiredArea;
  if (pricing.priceUnit === "piece") quantity = requiredUnits ?? null;

  if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) return null;
  const cost = quantity * pricing.price;
  return Number.isFinite(cost) && cost >= 0 ? cost : null;
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getPriceUnitLabel(material: PlannerMaterialDefinition): string {
  const unitLabels = {
    package: "упаковка",
    m2: "м²",
    piece: "шт.",
    roll: "рулон",
    can: "банка",
    bag: "мешок",
    "linear-meter": "пог. м",
  } as const;
  return material.pricing ? unitLabels[material.pricing.priceUnit] : "";
}

export function aggregateRoomMaterials(rooms: PlannerRoom[]): MaterialAggregate[] {
  const aggregates = new Map<string, MaterialAggregate>();
  const surfaces: MaterialSurface[] = ["floor", "walls", "ceiling"];

  rooms.forEach((room, roomIndex) => {
    surfaces.forEach((surface) => {
      const selection = room.finishes[surface];
      const material = getMaterialById(selection.materialId);
      if (!material || material.isNone) return;
      const calculation = calculateMaterialRequirement(
        getRoomSurfaceArea(room, surface),
        selection,
      );
      const roomRequirement: MaterialRoomRequirement = {
        ...calculation,
        roomId: room.id,
        roomName: getRoomName(room, roomIndex),
        wastePercent: selection.wastePercent,
        totalCost: calculateMaterialCost(calculation, material),
      };
      const roomCost = roomRequirement.totalCost;
      const current = aggregates.get(material.id);
      aggregates.set(material.id, {
        materialId: material.id,
        surface,
        baseArea: (current?.baseArea ?? 0) + calculation.baseArea,
        requiredArea: (current?.requiredArea ?? 0) + calculation.requiredArea,
        roomCount: (current?.roomCount ?? 0) + 1,
        wastePercents: Array.from(
          new Set([...(current?.wastePercents ?? []), selection.wastePercent]),
        ),
        rooms: [...(current?.rooms ?? []), roomRequirement],
        totalCost:
          roomCost === null || current?.totalCost === null
            ? null
            : (current?.totalCost ?? 0) + roomCost,
        packages:
          calculation.packages === null
            ? null
            : (current?.packages ?? 0) + calculation.packages,
        purchasedArea:
          calculation.purchasedArea === null
            ? null
            : (current?.purchasedArea ?? 0) + calculation.purchasedArea,
      });
    });
  });

  return Array.from(aggregates.values());
}

export function getMaterialWasteLabel(aggregate: MaterialAggregate): string {
  return aggregate.wastePercents.length === 1
    ? `${aggregate.wastePercents[0]}%`
    : "индивидуальный";
}

export function getMaterialScheduleSummary(
  rooms: PlannerRoom[],
  aggregates = aggregateRoomMaterials(rooms),
): MaterialScheduleSummary {
  const requiredAreaBySurface: Record<MaterialSurface, number> = {
    floor: 0,
    walls: 0,
    ceiling: 0,
  };
  const costBySurface: Record<MaterialSurface, number> = {
    floor: 0,
    walls: 0,
    ceiling: 0,
  };
  aggregates.forEach((aggregate) => {
    requiredAreaBySurface[aggregate.surface] += aggregate.requiredArea;
    costBySurface[aggregate.surface] += aggregate.totalCost ?? 0;
  });
  return {
    selectedCount: aggregates.reduce((total, item) => total + item.roomCount, 0),
    purchasePositionCount: aggregates.length,
    requiredAreaBySurface,
    costBySurface,
    totalCost: Object.values(costBySurface).reduce((total, cost) => total + cost, 0),
  };
}

export function isMaterialsStepComplete(rooms: PlannerRoom[]): boolean {
  return rooms.length > 0 && rooms.every((room) => {
    const finishesSelected = Object.values(room.finishes).every(
      (selection) => getMaterialById(selection.materialId) !== undefined,
    );
    const openingsComplete = [...room.doors, ...room.windows].every(isOpeningValid);
    return finishesSelected && openingsComplete && areRoomOpeningsValid(room);
  });
}
