import type {
  ArchitecturalGraph,
  ArchitecturalNode,
  PixelPoint,
} from "@/components/planner/architectural-graph";
import { projectPointToSegment } from "@/components/planner/architectural-graph";
import type {
  ImportedWall,
  NormalizedPoint2D,
} from "@/components/planner/imported-plan-types";

export const DEFAULT_ROOM_SNAP_OPTIONS = {
  roomNodeSnapTolerancePx: 10,
  roomWallSnapTolerancePx: 12,
} as const;

export type RoomVertexSnapKind = "node" | "wall" | "free";

export type RoomVertexSnapResult = {
  point: NormalizedPoint2D;
  kind: RoomVertexSnapKind;
  nodeId?: string;
  wallId?: string;
  distancePixels: number;
  closesDraft: boolean;
};

export type RoomVertexSnapOptions = {
  imageWidthPx: number;
  imageHeightPx: number;
  roomNodeSnapTolerancePx?: number;
  roomWallSnapTolerancePx?: number;
  firstDraftVertex?: NormalizedPoint2D;
};

const EPSILON = 1e-9;

function isFinitePoint(point: NormalizedPoint2D) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isValidImageSize(width: number, height: number) {
  return Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;
}

function toPixel(point: NormalizedPoint2D, width: number, height: number): PixelPoint {
  return { x: point.x * width, y: point.y * height };
}

function toNormalized(point: PixelPoint, width: number, height: number): NormalizedPoint2D {
  return {
    x: Math.max(0, Math.min(1, point.x / width)),
    y: Math.max(0, Math.min(1, point.y / height)),
  };
}

function pixelDistance(
  first: NormalizedPoint2D,
  second: NormalizedPoint2D,
  width: number,
  height: number,
) {
  return Math.hypot((second.x - first.x) * width, (second.y - first.y) * height);
}

export function getNearestArchitecturalNode(
  point: NormalizedPoint2D,
  nodes: ArchitecturalNode[],
  imageWidthPx: number,
  imageHeightPx: number,
) {
  if (!isFinitePoint(point) || !isValidImageSize(imageWidthPx, imageHeightPx)) return null;
  let nearest: { node: ArchitecturalNode; distancePixels: number } | null = null;
  for (const node of nodes) {
    if (!isFinitePoint(node.point)) continue;
    const distancePixels = pixelDistance(point, node.point, imageWidthPx, imageHeightPx);
    if (
      !nearest ||
      distancePixels < nearest.distancePixels - EPSILON ||
      (Math.abs(distancePixels - nearest.distancePixels) <= EPSILON && node.id < nearest.node.id)
    ) {
      nearest = { node, distancePixels };
    }
  }
  return nearest;
}

export function getNearestRoomWallProjection(
  point: NormalizedPoint2D,
  walls: ImportedWall[],
  imageWidthPx: number,
  imageHeightPx: number,
) {
  if (!isFinitePoint(point) || !isValidImageSize(imageWidthPx, imageHeightPx)) return null;
  const pointerPx = toPixel(point, imageWidthPx, imageHeightPx);
  let nearest: { wallId: string; point: NormalizedPoint2D; position: number; distancePixels: number } | null = null;
  for (const wall of walls) {
    if (!isFinitePoint(wall.start) || !isFinitePoint(wall.end)) continue;
    const projection = projectPointToSegment(pointerPx, {
      start: toPixel(wall.start, imageWidthPx, imageHeightPx),
      end: toPixel(wall.end, imageWidthPx, imageHeightPx),
    });
    if (!projection) continue;
    if (
      !nearest ||
      projection.distancePixels < nearest.distancePixels - EPSILON ||
      (Math.abs(projection.distancePixels - nearest.distancePixels) <= EPSILON && wall.id < nearest.wallId)
    ) {
      nearest = {
        wallId: wall.id,
        point: toNormalized(projection.point, imageWidthPx, imageHeightPx),
        position: projection.position,
        distancePixels: projection.distancePixels,
      };
    }
  }
  return nearest;
}

export function getRoomVertexSnap(
  rawPoint: NormalizedPoint2D,
  graph: ArchitecturalGraph,
  walls: ImportedWall[],
  options: RoomVertexSnapOptions,
): RoomVertexSnapResult | null {
  const {
    imageWidthPx,
    imageHeightPx,
    roomNodeSnapTolerancePx = DEFAULT_ROOM_SNAP_OPTIONS.roomNodeSnapTolerancePx,
    roomWallSnapTolerancePx = DEFAULT_ROOM_SNAP_OPTIONS.roomWallSnapTolerancePx,
    firstDraftVertex,
  } = options;
  if (
    !isFinitePoint(rawPoint) ||
    rawPoint.x < 0 || rawPoint.x > 1 || rawPoint.y < 0 || rawPoint.y > 1 ||
    !isValidImageSize(imageWidthPx, imageHeightPx)
  ) return null;

  const nearestNode = getNearestArchitecturalNode(rawPoint, graph.nodes, imageWidthPx, imageHeightPx);
  if (nearestNode && nearestNode.distancePixels <= roomNodeSnapTolerancePx) {
    return {
      point: { ...nearestNode.node.point },
      kind: "node",
      nodeId: nearestNode.node.id,
      distancePixels: nearestNode.distancePixels,
      closesDraft: Boolean(firstDraftVertex && pixelDistance(nearestNode.node.point, firstDraftVertex, imageWidthPx, imageHeightPx) <= EPSILON),
    };
  }

  if (firstDraftVertex && isFinitePoint(firstDraftVertex)) {
    const closureDistance = pixelDistance(rawPoint, firstDraftVertex, imageWidthPx, imageHeightPx);
    if (closureDistance <= roomNodeSnapTolerancePx) {
      return {
        point: { ...firstDraftVertex },
        kind: "free",
        distancePixels: closureDistance,
        closesDraft: true,
      };
    }
  }

  const nearestWall = getNearestRoomWallProjection(rawPoint, walls, imageWidthPx, imageHeightPx);
  if (nearestWall && nearestWall.distancePixels <= roomWallSnapTolerancePx) {
    return {
      point: nearestWall.point,
      kind: "wall",
      wallId: nearestWall.wallId,
      distancePixels: nearestWall.distancePixels,
      closesDraft: false,
    };
  }

  return {
    point: { ...rawPoint },
    kind: "free",
    distancePixels: nearestWall?.distancePixels ?? Number.POSITIVE_INFINITY,
    closesDraft: false,
  };
}
