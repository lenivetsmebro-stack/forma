import { getMaterialById } from "@/components/planner/material-catalog";
import type {
  MaterialSurface,
  PlannerMaterialSelection,
  PlannerRoom,
  WastePercent,
} from "@/components/planner/types";
import {
  calculateNetWallArea,
  calculateRoomCeilingArea,
  calculateRoomFloorArea,
} from "@/components/planner/planner-utils";

export interface MaterialCalculation {
  baseArea: number;
  requiredArea: number;
  packages: number | null;
  purchasedArea: number | null;
}

export interface MaterialAggregate extends MaterialCalculation {
  materialId: string;
  roomCount: number;
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

export function aggregateRoomMaterials(rooms: PlannerRoom[]): MaterialAggregate[] {
  const aggregates = new Map<string, Omit<MaterialAggregate, "packages" | "purchasedArea">>();
  const surfaces: MaterialSurface[] = ["floor", "walls", "ceiling"];

  rooms.forEach((room) => {
    surfaces.forEach((surface) => {
      const selection = room.finishes[surface];
      const material = getMaterialById(selection.materialId);
      if (!material || material.isNone) return;
      const calculation = calculateMaterialRequirement(
        getRoomSurfaceArea(room, surface),
        selection,
      );
      const current = aggregates.get(material.id);
      aggregates.set(material.id, {
        materialId: material.id,
        baseArea: (current?.baseArea ?? 0) + calculation.baseArea,
        requiredArea: (current?.requiredArea ?? 0) + calculation.requiredArea,
        roomCount: (current?.roomCount ?? 0) + 1,
      });
    });
  });

  return Array.from(aggregates.values()).map((aggregate) => {
    const material = getMaterialById(aggregate.materialId);
    return {
      ...aggregate,
      ...calculatePackageRequirement(
        aggregate.requiredArea,
        material?.coveragePerPackage,
      ),
    };
  });
}
