import type {
  ImportedFloorPlan,
  ImportedOpening,
  ImportedRoom,
  ImportValidationIssue,
  ImportValidationResult,
  Point2D,
} from "@/components/planner/imported-plan-types";

export const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "pdf"]);
const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

type PlanFileDescriptor = Pick<File, "name" | "size" | "type">;

export function getPlanFileExtension(fileName: string) {
  return fileName.trim().toLowerCase().split(".").pop() ?? "";
}

export function isSupportedPlanFile(file: PlanFileDescriptor) {
  const extensionSupported = SUPPORTED_EXTENSIONS.has(
    getPlanFileExtension(file.name),
  );
  const mimeSupported = file.type === "" || SUPPORTED_MIME_TYPES.has(file.type);

  return extensionSupported && mimeSupported && file.size > 0;
}

export function getImportedPlanSourceType(
  file: PlanFileDescriptor,
): ImportedFloorPlan["sourceType"] | null {
  if (!isSupportedPlanFile(file)) return null;
  return getPlanFileExtension(file.name) === "pdf" ? "pdf" : "image";
}

export function formatImportFileSize(size: number) {
  if (!Number.isFinite(size) || size < 0) return "—";
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function isPositive(value: number | undefined) {
  return value !== undefined && isFiniteNumber(value) && value > 0;
}

function normalizePoint(point: Point2D): Point2D | null {
  if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) return null;
  return { x: point.x, y: point.y };
}

function normalizeOpening(opening: ImportedOpening): ImportedOpening | null {
  const id = opening.id.trim();
  const wallId = opening.wallId.trim();
  if (
    !id ||
    !wallId ||
    (opening.type !== "door" && opening.type !== "window") ||
    !isPositive(opening.width) ||
    !isFiniteNumber(opening.offset) ||
    opening.offset < 0 ||
    (opening.height !== undefined && !isPositive(opening.height)) ||
    (opening.sillHeight !== undefined &&
      (!isFiniteNumber(opening.sillHeight) || opening.sillHeight < 0))
  ) {
    return null;
  }

  return {
    id,
    type: opening.type,
    wallId,
    width: opening.width,
    offset: opening.offset,
    ...(opening.height === undefined ? {} : { height: opening.height }),
    ...(opening.sillHeight === undefined
      ? {}
      : { sillHeight: opening.sillHeight }),
  };
}

function normalizeRoom(room: ImportedRoom): ImportedRoom | null {
  const id = room.id.trim();
  const polygon = room.polygon
    .map(normalizePoint)
    .filter((point): point is Point2D => point !== null);

  if (!id || polygon.length < 3) return null;

  const ceilingHeight = isPositive(room.ceilingHeight)
    ? room.ceilingHeight
    : undefined;

  return {
    id,
    ...(room.name?.trim() ? { name: room.name.trim() } : {}),
    polygon,
    ...(ceilingHeight === undefined ? {} : { ceilingHeight }),
    doors: room.doors
      .map(normalizeOpening)
      .filter((opening): opening is ImportedOpening => opening !== null),
    windows: room.windows
      .map(normalizeOpening)
      .filter((opening): opening is ImportedOpening => opening !== null),
  };
}

/**
 * Sanitizes imported source data without applying planScale. Coordinates remain
 * in plan units until the future markup/conversion step. Vertical heights are
 * independent real-world values and are never multiplied by planScale.
 */
export function normalizeImportedFloorPlan(
  plan: ImportedFloorPlan,
): ImportedFloorPlan {
  return {
    sourceType: plan.sourceType,
    fileName: plan.fileName.trim(),
    ...(isPositive(plan.planScale) ? { planScale: plan.planScale } : {}),
    ...(isPositive(plan.defaultCeilingHeight)
      ? { defaultCeilingHeight: plan.defaultCeilingHeight }
      : {}),
    rooms: plan.rooms
      .map(normalizeRoom)
      .filter((room): room is ImportedRoom => room !== null),
  };
}

function validateOpening(
  opening: ImportedOpening,
  roomId: string,
): ImportValidationIssue[] {
  const issues: ImportValidationIssue[] = [];
  if (!opening.wallId.trim()) {
    issues.push({
      code: "MISSING_WALL_REFERENCE",
      message: "Для проёма не указана стена.",
      roomId,
      openingId: opening.id,
    });
  }
  if (
    !opening.id.trim() ||
    (opening.type !== "door" && opening.type !== "window") ||
    !isPositive(opening.width) ||
    !isFiniteNumber(opening.offset) ||
    opening.offset < 0 ||
    (opening.height !== undefined && !isPositive(opening.height)) ||
    (opening.sillHeight !== undefined &&
      (!isFiniteNumber(opening.sillHeight) || opening.sillHeight < 0))
  ) {
    issues.push({
      code: "INVALID_OPENING",
      message: "Проверьте размеры и положение проёма.",
      roomId,
      openingId: opening.id,
    });
  }
  return issues;
}

export function validateImportedFloorPlan(
  plan: ImportedFloorPlan,
): ImportValidationResult {
  const errors: ImportValidationIssue[] = [];
  const warnings: ImportValidationIssue[] = [];

  if (!isPositive(plan.planScale)) {
    warnings.push({
      code: "MISSING_SCALE",
      message:
        "Масштаб не задан. Его можно определить по известному размеру на этапе разметки.",
    });
  }
  if (!isPositive(plan.defaultCeilingHeight)) {
    warnings.push({
      code: "INVALID_CEILING_HEIGHT",
      message: "Укажите базовую высоту потолков больше нуля.",
    });
  }
  if (plan.rooms.length === 0) {
    warnings.push({
      code: "NO_ROOMS",
      message: "Геометрия помещений ещё не размечена.",
    });
  }

  for (const room of plan.rooms) {
    if (
      !room.id.trim() ||
      room.polygon.length < 3 ||
      room.polygon.some(
        (point) => !isFiniteNumber(point.x) || !isFiniteNumber(point.y),
      )
    ) {
      errors.push({
        code: "INVALID_ROOM_POLYGON",
        message: "Контур помещения должен содержать минимум три точки.",
        roomId: room.id,
      });
    }
    if (
      room.ceilingHeight !== undefined &&
      !isPositive(room.ceilingHeight)
    ) {
      errors.push({
        code: "INVALID_CEILING_HEIGHT",
        message: "Высота потолка помещения должна быть больше нуля.",
        roomId: room.id,
      });
    }
    for (const opening of [...room.doors, ...room.windows]) {
      errors.push(...validateOpening(opening, room.id));
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
