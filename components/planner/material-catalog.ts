import type {
  MaterialSurface,
  PlannerMaterialDefinition,
} from "@/components/planner/types";

export const materialSurfaceLabels: Record<MaterialSurface, string> = {
  floor: "Пол",
  walls: "Стены",
  ceiling: "Потолок",
};

export const materialCatalog: PlannerMaterialDefinition[] = [
  { id: "floor-laminate", surface: "floor", label: "Ламинат", calculationUnit: "package", coveragePerPackage: 2.2 },
  { id: "floor-tile", surface: "floor", label: "Керамогранит / плитка", calculationUnit: "package", coveragePerPackage: 1.44 },
  { id: "floor-quartz-vinyl", surface: "floor", label: "Кварцвинил", calculationUnit: "package", coveragePerPackage: 2 },
  { id: "floor-parquet", surface: "floor", label: "Паркет / инженерная доска", calculationUnit: "m2" },
  { id: "floor-linoleum", surface: "floor", label: "Линолеум", calculationUnit: "m2" },
  { id: "floor-none", surface: "floor", label: "Без отделки", calculationUnit: "m2", isNone: true },
  { id: "walls-paint", surface: "walls", label: "Краска", calculationUnit: "m2" },
  { id: "walls-wallpaper", surface: "walls", label: "Обои", calculationUnit: "m2" },
  { id: "walls-plaster", surface: "walls", label: "Декоративная штукатурка", calculationUnit: "m2" },
  { id: "walls-tile", surface: "walls", label: "Плитка", calculationUnit: "package", coveragePerPackage: 1.44 },
  { id: "walls-panels", surface: "walls", label: "Стеновые панели", calculationUnit: "m2" },
  { id: "walls-none", surface: "walls", label: "Без отделки", calculationUnit: "m2", isNone: true },
  { id: "ceiling-paint", surface: "ceiling", label: "Краска", calculationUnit: "m2" },
  { id: "ceiling-plaster", surface: "ceiling", label: "Штукатурка / шпаклёвка", calculationUnit: "m2" },
  { id: "ceiling-stretch", surface: "ceiling", label: "Натяжной потолок", calculationUnit: "m2" },
  { id: "ceiling-drywall", surface: "ceiling", label: "ГКЛ", calculationUnit: "m2" },
  { id: "ceiling-none", surface: "ceiling", label: "Без отделки", calculationUnit: "m2", isNone: true },
];

export function getMaterialsForSurface(surface: MaterialSurface) {
  return materialCatalog.filter((material) => material.surface === surface);
}

export function getMaterialById(materialId: string) {
  return materialCatalog.find((material) => material.id === materialId);
}
