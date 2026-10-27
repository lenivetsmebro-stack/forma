export type PropertyKind = "apartment" | "house";
export type Condition = "new" | "secondary";
export type Package = "cosmetic" | "capital" | "designer";

export type EstimateInput = {
  kind: PropertyKind;
  condition: Condition;
  pack: Package;
  area: number;
  withDesign: boolean;
};

export type Estimate = {
  worksMin: number;
  worksMax: number;
  design: number;
  totalMin: number;
  totalMax: number;
  monthsMin: number;
  monthsMax: number;
};

export const PACKAGES: Record<Package, { label: string; note: string; min: number; max: number; pace: number }> = {
  cosmetic: { label: "Косметический", note: "Покраска, полы, замена дверей и сантехники без переноса инженерии", min: 9_000, max: 13_000, pace: 35 },
  capital: { label: "Капитальный", note: "Демонтаж, новая электрика и сантехника, выравнивание, чистовая отделка", min: 18_000, max: 26_000, pace: 20 },
  designer: { label: "По дизайн-проекту", note: "Сложные узлы, скрытые двери, подсветка, индивидуальная мебель", min: 30_000, max: 45_000, pace: 14 },
};

export const CONDITIONS: Record<Condition, { label: string; factor: number }> = {
  new: { label: "Новостройка", factor: 1 },
  secondary: { label: "Вторичное жильё", factor: 1.15 },
};

export const KINDS: Record<PropertyKind, { label: string; factor: number }> = {
  apartment: { label: "Квартира", factor: 1 },
  house: { label: "Дом", factor: 1.12 },
};

export const DESIGN_RATE = 2_500;
export const AREA_MIN = 10;
export const AREA_MAX = 500;

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function calculateEstimate(input: EstimateInput): Estimate | null {
  if (!Number.isFinite(input.area) || input.area < AREA_MIN || input.area > AREA_MAX) return null;
  const pack = PACKAGES[input.pack];
  const factor = CONDITIONS[input.condition].factor * KINDS[input.kind].factor;
  const worksMin = roundTo(input.area * pack.min * factor, 10_000);
  const worksMax = roundTo(input.area * pack.max * factor, 10_000);
  const design = input.withDesign ? roundTo(input.area * DESIGN_RATE, 5_000) : 0;
  const baseMonths = input.area / pack.pace;
  return {
    worksMin,
    worksMax,
    design,
    totalMin: worksMin + design,
    totalMax: worksMax + design,
    monthsMin: Math.max(1, Math.round(baseMonths)),
    monthsMax: Math.max(2, Math.ceil(baseMonths * 1.35)),
  };
}

export function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value) + " ₽";
}
