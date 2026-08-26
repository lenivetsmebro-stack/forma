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
  { id: "floor-laminate", surface: "floor", label: "Ламинат", calculationUnit: "package", coveragePerPackage: 2.2, pricing: { price: 1990, priceUnit: "package", source: "demo-local" } },
  { id: "floor-tile", surface: "floor", label: "Керамогранит / плитка", calculationUnit: "package", coveragePerPackage: 1.44, pricing: { price: 1590, priceUnit: "m2", source: "demo-local" } },
  { id: "floor-quartz-vinyl", surface: "floor", label: "Кварцвинил", calculationUnit: "package", coveragePerPackage: 2, pricing: { price: 2490, priceUnit: "package", source: "demo-local" } },
  { id: "floor-parquet", surface: "floor", label: "Паркет / инженерная доска", calculationUnit: "m2", pricing: { price: 4500, priceUnit: "m2", source: "demo-local" } },
  { id: "floor-linoleum", surface: "floor", label: "Линолеум", calculationUnit: "m2", pricing: { price: 850, priceUnit: "m2", source: "demo-local" } },
  { id: "floor-none", surface: "floor", label: "Без отделки", calculationUnit: "m2", isNone: true },
  { id: "walls-paint", surface: "walls", label: "Краска", calculationUnit: "m2", pricing: { price: 420, priceUnit: "m2", source: "demo-local" } },
  { id: "walls-wallpaper", surface: "walls", label: "Обои", calculationUnit: "m2", pricing: { price: 780, priceUnit: "m2", source: "demo-local" } },
  { id: "walls-plaster", surface: "walls", label: "Декоративная штукатурка", calculationUnit: "m2", pricing: { price: 1100, priceUnit: "m2", source: "demo-local" } },
  { id: "walls-tile", surface: "walls", label: "Плитка", calculationUnit: "package", coveragePerPackage: 1.44, pricing: { price: 1590, priceUnit: "m2", source: "demo-local" } },
  { id: "walls-panels", surface: "walls", label: "Стеновые панели", calculationUnit: "m2", pricing: { price: 1800, priceUnit: "m2", source: "demo-local" } },
  { id: "walls-none", surface: "walls", label: "Без отделки", calculationUnit: "m2", isNone: true },
  { id: "ceiling-paint", surface: "ceiling", label: "Краска", calculationUnit: "m2", pricing: { price: 390, priceUnit: "m2", source: "demo-local" } },
  { id: "ceiling-plaster", surface: "ceiling", label: "Штукатурка / шпаклёвка", calculationUnit: "m2", pricing: { price: 650, priceUnit: "m2", source: "demo-local" } },
  { id: "ceiling-stretch", surface: "ceiling", label: "Натяжной потолок", calculationUnit: "m2", pricing: { price: 1200, priceUnit: "m2", source: "demo-local" } },
  { id: "ceiling-drywall", surface: "ceiling", label: "ГКЛ", calculationUnit: "m2", pricing: { price: 980, priceUnit: "m2", source: "demo-local" } },
  { id: "ceiling-none", surface: "ceiling", label: "Без отделки", calculationUnit: "m2", isNone: true },
];

export function getMaterialsForSurface(surface: MaterialSurface) {
  return materialCatalog.filter((material) => material.surface === surface);
}

export function getMaterialById(materialId: string) {
  return materialCatalog.find((material) => material.id === materialId);
}
