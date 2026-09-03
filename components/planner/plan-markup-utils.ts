import type {
  ImportedWall,
  NormalizedPoint2D,
  PlanScaleCalibration,
  Point2D,
} from "@/components/planner/imported-plan-types";

export type Rect2D = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Size2D = {
  width: number;
  height: number;
};

function isFinitePoint(point: Point2D) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isPositiveSize(size: Size2D) {
  return (
    Number.isFinite(size.width) &&
    Number.isFinite(size.height) &&
    size.width > 0 &&
    size.height > 0
  );
}

export function getContainedImageRect(
  container: Rect2D,
  intrinsicSize: Size2D,
): Rect2D | null {
  if (
    !isPositiveSize(container) ||
    !isPositiveSize(intrinsicSize) ||
    !Number.isFinite(container.left) ||
    !Number.isFinite(container.top)
  ) {
    return null;
  }

  const scale = Math.min(
    container.width / intrinsicSize.width,
    container.height / intrinsicSize.height,
  );
  const width = intrinsicSize.width * scale;
  const height = intrinsicSize.height * scale;

  return {
    left: container.left + (container.width - width) / 2,
    top: container.top + (container.height - height) / 2,
    width,
    height,
  };
}

export function getNormalizedPoint(
  pointer: Point2D,
  imageRect: Rect2D,
): NormalizedPoint2D | null {
  if (!isFinitePoint(pointer) || !isPositiveSize(imageRect)) return null;
  const x = (pointer.x - imageRect.left) / imageRect.width;
  const y = (pointer.y - imageRect.top) / imageRect.height;

  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

export function getNormalizedDistance(
  pointA: NormalizedPoint2D,
  pointB: NormalizedPoint2D,
) {
  if (!isFinitePoint(pointA) || !isFinitePoint(pointB)) return null;
  return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

export function createScaleCalibration(
  pointA: NormalizedPoint2D,
  pointB: NormalizedPoint2D,
  realLengthMeters: number,
): PlanScaleCalibration | null {
  const imageDistance = getNormalizedDistance(pointA, pointB);
  if (
    imageDistance === null ||
    imageDistance <= 0 ||
    !Number.isFinite(realLengthMeters) ||
    realLengthMeters <= 0
  ) {
    return null;
  }

  const metersPerNormalizedUnit = realLengthMeters / imageDistance;
  if (!Number.isFinite(metersPerNormalizedUnit)) return null;

  return {
    pointA: { ...pointA },
    pointB: { ...pointB },
    realLengthMeters,
    imageDistance,
    metersPerNormalizedUnit,
  };
}

export function getRealDistanceFromCalibration(
  normalizedDistance: number,
  calibration: PlanScaleCalibration,
) {
  if (
    !Number.isFinite(normalizedDistance) ||
    normalizedDistance < 0 ||
    !Number.isFinite(calibration.metersPerNormalizedUnit) ||
    calibration.metersPerNormalizedUnit <= 0
  ) {
    return null;
  }
  return normalizedDistance * calibration.metersPerNormalizedUnit;
}

export function getWallLengthMeters(
  wall: ImportedWall,
  calibration: PlanScaleCalibration,
) {
  const normalizedDistance = getNormalizedDistance(wall.start, wall.end);
  return normalizedDistance === null
    ? null
    : getRealDistanceFromCalibration(normalizedDistance, calibration);
}

export function getTotalWallLengthMeters(
  walls: ImportedWall[],
  calibration: PlanScaleCalibration,
) {
  return walls.reduce((total, wall) => {
    const length = getWallLengthMeters(wall, calibration);
    return total + (length ?? 0);
  }, 0);
}
