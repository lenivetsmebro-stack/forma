import type {
  ImportedMarkupOpening,
  ImportedPlanMarkup,
  ImportedRoomPolygon,
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

export type WallHit = {
  wallId: string;
  position: number;
  point: NormalizedPoint2D;
  distancePixels: number;
};

export type OpeningPixelSpan = {
  start: NormalizedPoint2D;
  end: NormalizedPoint2D;
};

const GEOMETRY_EPSILON = 1e-9;

function isFinitePoint(point: Point2D) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isNormalizedPoint(point: NormalizedPoint2D) {
  return (
    isFinitePoint(point) &&
    point.x >= 0 && point.x <= 1 &&
    point.y >= 0 && point.y <= 1
  );
}

function isPositiveSize(size: Size2D) {
  return (
    Number.isFinite(size.width) && Number.isFinite(size.height) &&
    size.width > 0 && size.height > 0
  );
}

export function getContainedImageRect(container: Rect2D, intrinsicSize: Size2D): Rect2D | null {
  if (
    !isPositiveSize(container) || !isPositiveSize(intrinsicSize) ||
    !Number.isFinite(container.left) || !Number.isFinite(container.top)
  ) return null;

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

export function getNormalizedPoint(pointer: Point2D, imageRect: Rect2D): NormalizedPoint2D | null {
  if (!isFinitePoint(pointer) || !isPositiveSize(imageRect)) return null;
  const x = (pointer.x - imageRect.left) / imageRect.width;
  const y = (pointer.y - imageRect.top) / imageRect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

export function getNormalizedDistance(pointA: NormalizedPoint2D, pointB: NormalizedPoint2D) {
  if (!isFinitePoint(pointA) || !isFinitePoint(pointB)) return null;
  return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

export function getPixelDistance(
  pointA: NormalizedPoint2D,
  pointB: NormalizedPoint2D,
  imageSize: Size2D,
) {
  if (!isFinitePoint(pointA) || !isFinitePoint(pointB) || !isPositiveSize(imageSize)) return null;
  return Math.hypot(
    (pointB.x - pointA.x) * imageSize.width,
    (pointB.y - pointA.y) * imageSize.height,
  );
}

export function createScaleCalibration(
  pointA: NormalizedPoint2D,
  pointB: NormalizedPoint2D,
  realLengthMeters: number,
  imageSize: Size2D,
): PlanScaleCalibration | null {
  const pixelDistance = getPixelDistance(pointA, pointB, imageSize);
  if (
    pixelDistance === null || pixelDistance <= GEOMETRY_EPSILON ||
    !Number.isFinite(realLengthMeters) || realLengthMeters <= 0
  ) return null;

  const metersPerPixel = realLengthMeters / pixelDistance;
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return null;
  return {
    pointA: { ...pointA },
    pointB: { ...pointB },
    realLengthMeters,
    imageWidthPx: imageSize.width,
    imageHeightPx: imageSize.height,
    pixelDistance,
    metersPerPixel,
  };
}

export function getRealDistanceFromCalibration(
  pixelDistance: number,
  calibration: PlanScaleCalibration,
) {
  if (
    !Number.isFinite(pixelDistance) || pixelDistance < 0 ||
    !Number.isFinite(calibration.metersPerPixel) || calibration.metersPerPixel <= 0
  ) return null;
  return pixelDistance * calibration.metersPerPixel;
}

export function getWallLengthMeters(wall: ImportedWall, calibration: PlanScaleCalibration) {
  const pixelDistance = getPixelDistance(wall.start, wall.end, {
    width: calibration.imageWidthPx,
    height: calibration.imageHeightPx,
  });
  return pixelDistance === null ? null : getRealDistanceFromCalibration(pixelDistance, calibration);
}

export function getWallLengthPixels(wall: ImportedWall, imageSize: Size2D) {
  return getPixelDistance(wall.start, wall.end, imageSize);
}

export function getPointOnWall(wall: ImportedWall, position: number): NormalizedPoint2D | null {
  if (
    !isNormalizedPoint(wall.start) || !isNormalizedPoint(wall.end) ||
    !Number.isFinite(position) || position < 0 || position > 1
  ) return null;
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * position,
    y: wall.start.y + (wall.end.y - wall.start.y) * position,
  };
}

export function getNearestWallHit(
  point: NormalizedPoint2D,
  walls: ImportedWall[],
  imageSize: Size2D,
  hitThresholdPixels = 14,
): WallHit | null {
  if (
    !isNormalizedPoint(point) || !isPositiveSize(imageSize) ||
    !Number.isFinite(hitThresholdPixels) || hitThresholdPixels < 0
  ) return null;

  const pointX = point.x * imageSize.width;
  const pointY = point.y * imageSize.height;
  let nearest: WallHit | null = null;
  for (const wall of walls) {
    if (!isNormalizedPoint(wall.start) || !isNormalizedPoint(wall.end)) continue;
    const startX = wall.start.x * imageSize.width;
    const startY = wall.start.y * imageSize.height;
    const deltaX = (wall.end.x - wall.start.x) * imageSize.width;
    const deltaY = (wall.end.y - wall.start.y) * imageSize.height;
    const squaredLength = deltaX ** 2 + deltaY ** 2;
    if (squaredLength <= GEOMETRY_EPSILON) continue;
    const position = Math.max(0, Math.min(1,
      ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / squaredLength,
    ));
    const projectedX = startX + deltaX * position;
    const projectedY = startY + deltaY * position;
    const distancePixels = Math.hypot(pointX - projectedX, pointY - projectedY);
    if (distancePixels > hitThresholdPixels || (nearest && distancePixels >= nearest.distancePixels)) continue;
    nearest = {
      wallId: wall.id,
      position,
      point: { x: projectedX / imageSize.width, y: projectedY / imageSize.height },
      distancePixels,
    };
  }
  return nearest;
}

export function canOpeningFitOnWall(
  wall: ImportedWall,
  position: number,
  widthMeters: number,
  calibration: PlanScaleCalibration,
) {
  const wallLength = getWallLengthMeters(wall, calibration);
  if (
    wallLength === null || wallLength <= 0 ||
    !Number.isFinite(position) || position < 0 || position > 1 ||
    !Number.isFinite(widthMeters) || widthMeters <= 0
  ) return false;
  const halfWidth = widthMeters / 2;
  return halfWidth <= wallLength * position + GEOMETRY_EPSILON &&
    halfWidth <= wallLength * (1 - position) + GEOMETRY_EPSILON;
}

export function getOpeningPixelSpan(
  opening: ImportedMarkupOpening,
  wall: ImportedWall,
  calibration: PlanScaleCalibration,
): OpeningPixelSpan | null {
  if (!canOpeningFitOnWall(wall, opening.position, opening.widthMeters, calibration)) return null;
  const wallLengthPixels = getWallLengthPixels(wall, {
    width: calibration.imageWidthPx,
    height: calibration.imageHeightPx,
  });
  if (wallLengthPixels === null || wallLengthPixels <= 0) return null;
  const halfPosition = (opening.widthMeters / calibration.metersPerPixel / 2) / wallLengthPixels;
  const start = getPointOnWall(wall, opening.position - halfPosition);
  const end = getPointOnWall(wall, opening.position + halfPosition);
  return start && end ? { start, end } : null;
}

export function removeWallWithOpenings(markup: ImportedPlanMarkup, wallId: string): ImportedPlanMarkup {
  return {
    ...markup,
    walls: markup.walls.filter((wall) => wall.id !== wallId),
    openings: markup.openings.filter((opening) => opening.wallId !== wallId),
  };
}

export function getTotalWallLengthMeters(walls: ImportedWall[], calibration: PlanScaleCalibration) {
  return walls.reduce((total, wall) => total + (getWallLengthMeters(wall, calibration) ?? 0), 0);
}

export function getPolygonAreaNormalized(vertices: NormalizedPoint2D[]) {
  if (vertices.length < 3 || vertices.some((point) => !isFinitePoint(point))) return null;
  let twiceArea = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    if (!current || !next) return null;
    twiceArea += current.x * next.y - next.x * current.y;
  }
  return Math.abs(twiceArea) / 2;
}

export function getPolygonAreaPixels(vertices: NormalizedPoint2D[], imageSize: Size2D) {
  if (!isPositiveSize(imageSize)) return null;
  const normalizedArea = getPolygonAreaNormalized(vertices);
  return normalizedArea === null ? null : normalizedArea * imageSize.width * imageSize.height;
}

export function getRoomAreaMeters2(room: ImportedRoomPolygon, calibration: PlanScaleCalibration) {
  const pixelArea = getPolygonAreaPixels(room.vertices, {
    width: calibration.imageWidthPx,
    height: calibration.imageHeightPx,
  });
  if (pixelArea === null || !Number.isFinite(calibration.metersPerPixel)) return null;
  const area = pixelArea * calibration.metersPerPixel ** 2;
  return Number.isFinite(area) ? area : null;
}

export function getRoomPerimeterMeters(room: ImportedRoomPolygon, calibration: PlanScaleCalibration) {
  if (room.vertices.length < 3) return null;
  let perimeterPixels = 0;
  const imageSize = { width: calibration.imageWidthPx, height: calibration.imageHeightPx };
  for (let index = 0; index < room.vertices.length; index += 1) {
    const current = room.vertices[index];
    const next = room.vertices[(index + 1) % room.vertices.length];
    if (!current || !next) return null;
    const length = getPixelDistance(current, next, imageSize);
    if (length === null) return null;
    perimeterPixels += length;
  }
  return getRealDistanceFromCalibration(perimeterPixels, calibration);
}

function orientation(a: Point2D, b: Point2D, c: Point2D) {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function pointOnSegment(a: Point2D, b: Point2D, point: Point2D) {
  return (
    point.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON &&
    point.x >= Math.min(a.x, b.x) - GEOMETRY_EPSILON &&
    point.y <= Math.max(a.y, b.y) + GEOMETRY_EPSILON &&
    point.y >= Math.min(a.y, b.y) - GEOMETRY_EPSILON
  );
}

function segmentsIntersect(a: Point2D, b: Point2D, c: Point2D, d: Point2D) {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  if ((first > 0) !== (second > 0) && (third > 0) !== (fourth > 0)) return true;
  if (Math.abs(first) <= GEOMETRY_EPSILON && pointOnSegment(a, b, c)) return true;
  if (Math.abs(second) <= GEOMETRY_EPSILON && pointOnSegment(a, b, d)) return true;
  if (Math.abs(third) <= GEOMETRY_EPSILON && pointOnSegment(c, d, a)) return true;
  if (Math.abs(fourth) <= GEOMETRY_EPSILON && pointOnSegment(c, d, b)) return true;
  return false;
}

export function isSelfIntersectingPolygon(vertices: NormalizedPoint2D[]) {
  if (vertices.length < 4) return false;
  for (let firstIndex = 0; firstIndex < vertices.length; firstIndex += 1) {
    const firstStart = vertices[firstIndex];
    const firstEnd = vertices[(firstIndex + 1) % vertices.length];
    if (!firstStart || !firstEnd) return true;
    for (let secondIndex = firstIndex + 1; secondIndex < vertices.length; secondIndex += 1) {
      const adjacent = secondIndex === firstIndex + 1 || (firstIndex === 0 && secondIndex === vertices.length - 1);
      if (adjacent) continue;
      const secondStart = vertices[secondIndex];
      const secondEnd = vertices[(secondIndex + 1) % vertices.length];
      if (!secondStart || !secondEnd) return true;
      if (segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)) return true;
    }
  }
  return false;
}

export function isValidRoomPolygon(vertices: NormalizedPoint2D[], calibration: PlanScaleCalibration) {
  if (vertices.length < 3 || vertices.some((point) => !isNormalizedPoint(point))) return false;
  if (isSelfIntersectingPolygon(vertices)) return false;
  const pixelArea = getPolygonAreaPixels(vertices, {
    width: calibration.imageWidthPx,
    height: calibration.imageHeightPx,
  });
  return pixelArea !== null && pixelArea > 1;
}

export function arePointsNear(
  pointA: NormalizedPoint2D,
  pointB: NormalizedPoint2D,
  imageSize: Size2D,
  thresholdPixels = 4,
) {
  const distance = getPixelDistance(pointA, pointB, imageSize);
  return distance !== null && distance <= thresholdPixels;
}

export function getPolygonCentroid(vertices: NormalizedPoint2D[]) {
  if (vertices.length === 0 || vertices.some((point) => !isFinitePoint(point))) return null;
  let signedTwiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    if (!current || !next) return null;
    const cross = current.x * next.y - next.x * current.y;
    signedTwiceArea += cross;
    x += (current.x + next.x) * cross;
    y += (current.y + next.y) * cross;
  }
  if (Math.abs(signedTwiceArea) <= GEOMETRY_EPSILON) {
    return {
      x: vertices.reduce((sum, point) => sum + point.x, 0) / vertices.length,
      y: vertices.reduce((sum, point) => sum + point.y, 0) / vertices.length,
    };
  }
  return { x: x / (3 * signedTwiceArea), y: y / (3 * signedTwiceArea) };
}

export function getTotalRoomAreaMeters2(
  rooms: ImportedRoomPolygon[],
  calibration: PlanScaleCalibration,
) {
  return rooms.reduce((total, room) => total + (getRoomAreaMeters2(room, calibration) ?? 0), 0);
}
