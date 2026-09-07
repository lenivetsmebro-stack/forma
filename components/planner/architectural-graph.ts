import type {
  ImportedPlanMarkup,
  ImportedRoomPolygon,
  ImportedWall,
  NormalizedPoint2D,
} from "@/components/planner/imported-plan-types";
import { canOpeningFitOnWall } from "@/components/planner/plan-markup-utils";

export const DEFAULT_ARCHITECTURAL_GRAPH_OPTIONS = {
  endpointTolerancePx: 8,
  boundaryDistanceTolerancePx: 12,
  boundaryGapTolerancePx: 8,
  minimumBoundaryOverlapPx: 1,
  angleToleranceDegrees: 7,
  degenerateWallTolerancePx: 1,
  linkedCoverageRatio: 0.9,
  partialCoverageRatio: 0.5,
} as const;

export type ArchitecturalGraphOptions = {
  imageWidthPx: number;
  imageHeightPx: number;
  endpointTolerancePx?: number;
  boundaryDistanceTolerancePx?: number;
  boundaryGapTolerancePx?: number;
  minimumBoundaryOverlapPx?: number;
  angleToleranceDegrees?: number;
  degenerateWallTolerancePx?: number;
  linkedCoverageRatio?: number;
  partialCoverageRatio?: number;
};

export type ArchitecturalNode = { id: string; point: NormalizedPoint2D; wallIds: string[]; edgeIds: string[] };
export type ArchitecturalWallEdge = {
  id: string;
  wallId: string;
  sourceWallId: string;
  startNodeId: string;
  endNodeId: string;
  openingIds: string[];
};
export type RoomBoundaryStatus = "linked" | "partial" | "unlinked";
export type RoomBoundarySegmentStatus =
  | "MATCHED"
  | "PARTIAL"
  | "NO_NEARBY_WALL"
  | "ANGLE_MISMATCH"
  | "OFFSET_TOO_LARGE"
  | "COVERAGE_GAP"
  | "AMBIGUOUS_CANDIDATES"
  | "MISSING_BOUNDARY_WALL";
export type ArchitecturalRoomBoundarySegment = {
  segmentIndex: number;
  segmentLengthPx: number;
  coveredLengthPx: number;
  coverageRatio: number;
  matchedSourceWallIds: string[];
  nearestWallId: string | null;
  nearestWallDistancePx: number | null;
  nearestWallAngleDifferenceDegrees: number | null;
  status: RoomBoundarySegmentStatus;
  trace: ArchitecturalRoomBoundaryTrace;
};
export type BoundaryCandidateRejectionReason =
  | "MATCHED"
  | "NO_PROJECTED_OVERLAP"
  | "ANGLE_MISMATCH"
  | "OFFSET_TOO_LARGE"
  | "OVERLAP_TOO_SMALL";
export type SourceWallAuditClass =
  | "EXACT_OR_COMPATIBLE"
  | "PARALLEL_BUT_OFFSET"
  | "PARTIAL_OVERLAP"
  | "PERPENDICULAR_ENDPOINT_TOUCH"
  | "NO_PROJECTED_OVERLAP"
  | "ANGLE_MISMATCH";
export type ArchitecturalBoundaryCandidateTrace = {
  sourceWallId: string;
  derivedEdgeId?: string;
  normalizedStart: NormalizedPoint2D;
  normalizedEnd: NormalizedPoint2D;
  pixelStart: PixelPoint;
  pixelEnd: PixelPoint;
  angleDifferenceDegrees: number;
  segmentDistancePx: number;
  perpendicularDistancePx: number | null;
  projectedInterval: { start: number; end: number } | null;
  coverageInterval: { start: number; end: number } | null;
  overlapLengthPx: number;
  rejectionReason: BoundaryCandidateRejectionReason;
  auditClass: SourceWallAuditClass;
};
export type ArchitecturalRoomBoundaryTrace = {
  normalizedStart: NormalizedPoint2D;
  normalizedEnd: NormalizedPoint2D;
  pixelStart: PixelPoint;
  pixelEnd: PixelPoint;
  candidates: ArchitecturalBoundaryCandidateTrace[];
  sourceCandidates: ArchitecturalBoundaryCandidateTrace[];
  derivedCandidates: ArchitecturalBoundaryCandidateTrace[];
  compatibleSourceWallIds: string[];
  compatibleDerivedEdgeIds: string[];
};
export type ArchitecturalSourceWallInventory = {
  sourceWallId: string;
  normalizedStart: NormalizedPoint2D;
  normalizedEnd: NormalizedPoint2D;
  pixelStart: PixelPoint;
  pixelEnd: PixelPoint;
  sourceLengthPx: number;
  orientation: "horizontal-ish" | "vertical-ish" | "diagonal";
  derivedSegments: Array<{
    id: string;
    startNodeId: string;
    endNodeId: string;
    pixelStart: PixelPoint;
    pixelEnd: PixelPoint;
  }>;
};
export type ArchitecturalRoomBoundary = {
  roomId: string;
  wallIds: string[];
  closed: boolean;
  coverageRatio: number;
  unmatchedSegmentCount: number;
  unmatchedSegmentIndexes: number[];
  segments: ArchitecturalRoomBoundarySegment[];
  status: RoomBoundaryStatus;
};
export type ArchitecturalDiagnosticCode =
  | "DANGLING_NODE" | "ISOLATED_WALL" | "DEGENERATE_WALL"
  | "ORPHAN_OPENING" | "OPENING_FIT_INVALID" | "DUPLICATE_WALL"
  | "ROOM_BOUNDARY_INCOMPLETE";
export type ArchitecturalDiagnostic = {
  id: string;
  code: ArchitecturalDiagnosticCode;
  message: string;
  nodeId?: string;
  wallId?: string;
  roomId?: string;
  openingId?: string;
};
export type ArchitecturalGraph = {
  nodes: ArchitecturalNode[];
  edges: ArchitecturalWallEdge[];
  roomBoundaries: ArchitecturalRoomBoundary[];
  diagnostics: ArchitecturalDiagnostic[];
  wallInventory: ArchitecturalSourceWallInventory[];
  runtimeTrace: ArchitecturalGraphRuntimeTrace;
};
export type ArchitecturalGraphRuntimeTrace = {
  functionReceivedWallCount: number;
  functionReceivedWallIds: string[];
  sourceWallCount: number;
  sourceWallIds: string[];
  derivedSegmentCount: number;
  nodeCount: number;
  edgeCount: number;
};

export type PixelPoint = { x: number; y: number };
type PixelSegment = { start: PixelPoint; end: PixelPoint };
type SplitPoint = { position: number; nodeId: string };
type DerivedWallGeometry = { edge: ArchitecturalWallEdge; segment: PixelSegment };
type SourceWallGeometry = { sourceWallId: string; segment: PixelSegment };
const EPSILON = 1e-9;

function finitePositive(value: number) { return Number.isFinite(value) && value > 0; }
function toPixel(point: NormalizedPoint2D, width: number, height: number): PixelPoint {
  return { x: point.x * width, y: point.y * height };
}
function toNormalized(point: PixelPoint, width: number, height: number): NormalizedPoint2D {
  return { x: point.x / width, y: point.y / height };
}
function distance(a: PixelPoint, b: PixelPoint) { return Math.hypot(b.x - a.x, b.y - a.y); }
function segmentLength(segment: PixelSegment) { return distance(segment.start, segment.end); }
function wallSegment(wall: ImportedWall, width: number, height: number): PixelSegment {
  return { start: toPixel(wall.start, width, height), end: toPixel(wall.end, width, height) };
}
function wallOrientation(segment: PixelSegment): ArchitecturalSourceWallInventory["orientation"] {
  const absoluteX = Math.abs(segment.end.x - segment.start.x);
  const absoluteY = Math.abs(segment.end.y - segment.start.y);
  if (absoluteX <= absoluteY * 0.25) return "vertical-ish";
  if (absoluteY <= absoluteX * 0.25) return "horizontal-ish";
  return "diagonal";
}

export function projectPointToSegment(point: PixelPoint, segment: PixelSegment) {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const squaredLength = dx ** 2 + dy ** 2;
  if (squaredLength <= EPSILON) return null;
  const unclampedPosition = ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / squaredLength;
  const position = Math.max(0, Math.min(1, unclampedPosition));
  const projected = { x: segment.start.x + dx * position, y: segment.start.y + dy * position };
  return { point: projected, position, unclampedPosition, distancePixels: distance(point, projected) };
}

function angleDifferenceDegrees(first: PixelSegment, second: PixelSegment) {
  const firstX = first.end.x - first.start.x;
  const firstY = first.end.y - first.start.y;
  const secondX = second.end.x - second.start.x;
  const secondY = second.end.y - second.start.y;
  const denominator = Math.hypot(firstX, firstY) * Math.hypot(secondX, secondY);
  if (denominator <= EPSILON) return 90;
  const orientationIndependentDot = Math.abs((firstX * secondX + firstY * secondY) / denominator);
  return Math.acos(Math.max(-1, Math.min(1, orientationIndependentDot))) * 180 / Math.PI;
}

function segmentsIntersect(first: PixelSegment, second: PixelSegment) {
  const cross = (a: PixelPoint, b: PixelPoint, c: PixelPoint) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const firstA = cross(first.start, first.end, second.start);
  const firstB = cross(first.start, first.end, second.end);
  const secondA = cross(second.start, second.end, first.start);
  const secondB = cross(second.start, second.end, first.end);
  const onSegment = (segment: PixelSegment, point: PixelPoint) =>
    point.x >= Math.min(segment.start.x, segment.end.x) - EPSILON &&
    point.x <= Math.max(segment.start.x, segment.end.x) + EPSILON &&
    point.y >= Math.min(segment.start.y, segment.end.y) - EPSILON &&
    point.y <= Math.max(segment.start.y, segment.end.y) + EPSILON;
  if (Math.abs(firstA) <= EPSILON && onSegment(first, second.start)) return true;
  if (Math.abs(firstB) <= EPSILON && onSegment(first, second.end)) return true;
  if (Math.abs(secondA) <= EPSILON && onSegment(second, first.start)) return true;
  if (Math.abs(secondB) <= EPSILON && onSegment(second, first.end)) return true;
  return (firstA > 0) !== (firstB > 0) && (secondA > 0) !== (secondB > 0);
}

function segmentDistance(first: PixelSegment, second: PixelSegment) {
  if (segmentsIntersect(first, second)) return 0;
  const distances = [
    projectPointToSegment(first.start, second)?.distancePixels,
    projectPointToSegment(first.end, second)?.distancePixels,
    projectPointToSegment(second.start, first)?.distancePixels,
    projectPointToSegment(second.end, first)?.distancePixels,
  ].filter((value): value is number => value !== undefined);
  return distances.length > 0 ? Math.min(...distances) : Number.POSITIVE_INFINITY;
}

function getProjectedInterval(roomEdge: PixelSegment, wall: PixelSegment) {
  const edgeX = roomEdge.end.x - roomEdge.start.x;
  const edgeY = roomEdge.end.y - roomEdge.start.y;
  const squaredLength = edgeX ** 2 + edgeY ** 2;
  if (squaredLength <= EPSILON) return null;
  const project = (point: PixelPoint) =>
    ((point.x - roomEdge.start.x) * edgeX + (point.y - roomEdge.start.y) * edgeY) / squaredLength;
  const start = Math.max(0, Math.min(project(wall.start), project(wall.end)));
  const end = Math.min(1, Math.max(project(wall.start), project(wall.end)));
  return end - start > EPSILON ? { start, end } : null;
}

function distanceToInfiniteLine(point: PixelPoint, line: PixelSegment) {
  const lineX = line.end.x - line.start.x;
  const lineY = line.end.y - line.start.y;
  const length = Math.hypot(lineX, lineY);
  if (length <= EPSILON) return Number.POSITIVE_INFINITY;
  return Math.abs(lineX * (line.start.y - point.y) - (line.start.x - point.x) * lineY) / length;
}

function pointOnSegment(segment: PixelSegment, position: number): PixelPoint {
  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * position,
    y: segment.start.y + (segment.end.y - segment.start.y) * position,
  };
}

function getBoundaryOverlapInterval(
  roomEdge: PixelSegment,
  wall: PixelSegment,
  distanceTolerance: number,
  angleTolerance: number,
  minimumOverlapPx: number,
) {
  const angleDifference = angleDifferenceDegrees(roomEdge, wall);
  const interval = getProjectedInterval(roomEdge, wall);
  if (!interval || angleDifference > angleTolerance) return null;
  const overlapLengthPx = segmentLength(roomEdge) * (interval.end - interval.start);
  if (overlapLengthPx + EPSILON < minimumOverlapPx) return null;
  const maximumPerpendicularDistance = Math.max(
    distanceToInfiniteLine(pointOnSegment(roomEdge, interval.start), wall),
    distanceToInfiniteLine(pointOnSegment(roomEdge, interval.end), wall),
  );
  return maximumPerpendicularDistance <= distanceTolerance
    ? { ...interval, maximumPerpendicularDistance }
    : null;
}

function traceBoundaryCandidate(
  roomEdge: PixelSegment,
  candidate: SourceWallGeometry,
  options: Required<ArchitecturalGraphOptions>,
  derivedEdgeId?: string,
): ArchitecturalBoundaryCandidateTrace {
  const angle = angleDifferenceDegrees(roomEdge, candidate.segment);
  const projectedInterval = getProjectedInterval(roomEdge, candidate.segment);
  const roomLength = segmentLength(roomEdge);
  const overlapLengthPx = projectedInterval
    ? roomLength * (projectedInterval.end - projectedInterval.start)
    : 0;
  const perpendicularDistancePx = projectedInterval
    ? Math.max(
        distanceToInfiniteLine(pointOnSegment(roomEdge, projectedInterval.start), candidate.segment),
        distanceToInfiniteLine(pointOnSegment(roomEdge, projectedInterval.end), candidate.segment),
      )
    : null;
  const coverageInterval = getBoundaryOverlapInterval(
    roomEdge,
    candidate.segment,
    options.boundaryDistanceTolerancePx,
    options.angleToleranceDegrees,
    options.minimumBoundaryOverlapPx,
  );
  let rejectionReason: BoundaryCandidateRejectionReason = "MATCHED";
  if (!projectedInterval) rejectionReason = "NO_PROJECTED_OVERLAP";
  else if (angle > options.angleToleranceDegrees) rejectionReason = "ANGLE_MISMATCH";
  else if (overlapLengthPx + EPSILON < options.minimumBoundaryOverlapPx) rejectionReason = "OVERLAP_TOO_SMALL";
  else if ((perpendicularDistancePx ?? Number.POSITIVE_INFINITY) > options.boundaryDistanceTolerancePx) rejectionReason = "OFFSET_TOO_LARGE";
  const endpointTouch = !projectedInterval && segmentDistance(roomEdge, candidate.segment) <= EPSILON;
  let auditClass: SourceWallAuditClass;
  if (angle > options.angleToleranceDegrees) {
    auditClass = endpointTouch ? "PERPENDICULAR_ENDPOINT_TOUCH" : projectedInterval ? "ANGLE_MISMATCH" : "NO_PROJECTED_OVERLAP";
  } else if (!projectedInterval) auditClass = "NO_PROJECTED_OVERLAP";
  else if ((perpendicularDistancePx ?? Number.POSITIVE_INFINITY) > options.boundaryDistanceTolerancePx) auditClass = "PARALLEL_BUT_OFFSET";
  else if (overlapLengthPx + EPSILON < roomLength * options.linkedCoverageRatio) auditClass = "PARTIAL_OVERLAP";
  else auditClass = "EXACT_OR_COMPATIBLE";
  return {
    sourceWallId: candidate.sourceWallId,
    derivedEdgeId,
    normalizedStart: toNormalized(candidate.segment.start, options.imageWidthPx, options.imageHeightPx),
    normalizedEnd: toNormalized(candidate.segment.end, options.imageWidthPx, options.imageHeightPx),
    pixelStart: { ...candidate.segment.start },
    pixelEnd: { ...candidate.segment.end },
    angleDifferenceDegrees: angle,
    segmentDistancePx: segmentDistance(roomEdge, candidate.segment),
    perpendicularDistancePx,
    projectedInterval,
    coverageInterval: coverageInterval ? { start: coverageInterval.start, end: coverageInterval.end } : null,
    overlapLengthPx,
    rejectionReason,
    auditClass,
  };
}

export function findBoundaryCompatibleWalls(
  roomSegment: { start: NormalizedPoint2D; end: NormalizedPoint2D },
  walls: ImportedWall[],
  inputOptions: ArchitecturalGraphOptions,
) {
  if (!finitePositive(inputOptions.imageWidthPx) || !finitePositive(inputOptions.imageHeightPx)) return [];
  const options: Required<ArchitecturalGraphOptions> = { ...DEFAULT_ARCHITECTURAL_GRAPH_OPTIONS, ...inputOptions };
  const roomEdge = {
    start: toPixel(roomSegment.start, options.imageWidthPx, options.imageHeightPx),
    end: toPixel(roomSegment.end, options.imageWidthPx, options.imageHeightPx),
  };
  const auditPriority: Record<SourceWallAuditClass, number> = {
    EXACT_OR_COMPATIBLE: 0,
    PARTIAL_OVERLAP: 1,
    PARALLEL_BUT_OFFSET: 2,
    ANGLE_MISMATCH: 3,
    PERPENDICULAR_ENDPOINT_TOUCH: 4,
    NO_PROJECTED_OVERLAP: 5,
  };
  return [...walls]
    .sort((first, second) => first.id.localeCompare(second.id))
    .map((wall) => traceBoundaryCandidate(roomEdge, {
      sourceWallId: wall.id,
      segment: wallSegment(wall, options.imageWidthPx, options.imageHeightPx),
    }, options))
    .sort((first, second) =>
      auditPriority[first.auditClass] - auditPriority[second.auditClass] ||
      first.angleDifferenceDegrees - second.angleDifferenceDegrees ||
      (first.perpendicularDistancePx ?? Number.POSITIVE_INFINITY) - (second.perpendicularDistancePx ?? Number.POSITIVE_INFINITY) ||
      second.overlapLengthPx - first.overlapLengthPx ||
      first.sourceWallId.localeCompare(second.sourceWallId));
}

function mergeCoverageIntervals(intervals: Array<{ start: number; end: number }>, gapToleranceRatio: number) {
  if (intervals.length === 0) return { coveredRatio: 0, unresolvedGapCount: 0 };
  const sorted = [...intervals].sort((a, b) => a.start - b.start || a.end - b.end);
  let total = 0;
  let unresolvedGapCount = 0;
  let currentStart = sorted[0]?.start ?? 0;
  let currentEnd = sorted[0]?.end ?? 0;
  for (const interval of sorted.slice(1)) {
    if (interval.start <= currentEnd + gapToleranceRatio + EPSILON) currentEnd = Math.max(currentEnd, interval.end);
    else {
      total += currentEnd - currentStart;
      unresolvedGapCount += 1;
      currentStart = interval.start;
      currentEnd = interval.end;
    }
  }
  return { coveredRatio: total + currentEnd - currentStart, unresolvedGapCount };
}

function roomStatus(coverage: number, linked: number, partial: number): RoomBoundaryStatus {
  if (coverage + EPSILON >= linked) return "linked";
  if (coverage + EPSILON >= partial) return "partial";
  return "unlinked";
}

export function getNodeDegree(node: ArchitecturalNode) { return new Set(node.edgeIds).size; }

function matchRoomBoundary(
  room: ImportedRoomPolygon,
  sourceWalls: SourceWallGeometry[],
  derivedWalls: DerivedWallGeometry[],
  options: Required<ArchitecturalGraphOptions>,
): ArchitecturalRoomBoundary {
  let totalLength = 0;
  let coveredLength = 0;
  const wallIds = new Set<string>();
  const unmatchedSegmentIndexes: number[] = [];
  const segments: ArchitecturalRoomBoundarySegment[] = [];
  for (let index = 0; index < room.vertices.length; index += 1) {
    const start = room.vertices[index];
    const end = room.vertices[(index + 1) % room.vertices.length];
    if (!start || !end) continue;
    const roomEdge = { start: toPixel(start, options.imageWidthPx, options.imageHeightPx), end: toPixel(end, options.imageWidthPx, options.imageHeightPx) };
    const length = segmentLength(roomEdge);
    totalLength += length;
    const intervals: Array<{ start: number; end: number }> = [];
    const matchedWallIds = new Set<string>();
    const allCandidates: Array<{ wallId: string; distance: number; angle: number }> = [];
    const parallelCandidates: Array<{ wallId: string; distance: number; angle: number }> = [];
    const candidateTraces: ArchitecturalBoundaryCandidateTrace[] = [];
    const sourceCandidateTraces = sourceWalls.map((sourceWall) => traceBoundaryCandidate(roomEdge, sourceWall, options));
    for (const derivedWall of derivedWalls) {
      const trace = traceBoundaryCandidate(
        roomEdge,
        { sourceWallId: derivedWall.edge.sourceWallId, segment: derivedWall.segment },
        options,
        derivedWall.edge.id,
      );
      const angle = trace.angleDifferenceDegrees;
      const projectedInterval = trace.projectedInterval;
      const candidateDistance = trace.segmentDistancePx;
      const candidate = { wallId: derivedWall.edge.sourceWallId, distance: candidateDistance, angle };
      allCandidates.push(candidate);
      if (projectedInterval) {
        if (angle <= options.angleToleranceDegrees) parallelCandidates.push(candidate);
      }
      const interval = trace.coverageInterval;
      candidateTraces.push(trace);
      if (!interval) continue;
      intervals.push(interval);
      wallIds.add(derivedWall.edge.sourceWallId);
      matchedWallIds.add(derivedWall.edge.sourceWallId);
    }
    const candidateOrder = (first: { wallId: string; distance: number }, second: { wallId: string; distance: number }) =>
      first.distance - second.distance || first.wallId.localeCompare(second.wallId);
    allCandidates.sort(candidateOrder);
    parallelCandidates.sort(candidateOrder);
    const nearestAny = allCandidates[0] ?? null;
    const nearestParallel = parallelCandidates[0] ?? null;
    const gapToleranceRatio = length > EPSILON ? options.boundaryGapTolerancePx / length : 0;
    const mergedCoverage = mergeCoverageIntervals(intervals, gapToleranceRatio);
    const segmentCoverage = Math.min(1, mergedCoverage.coveredRatio);
    const segmentCoveredLength = length * segmentCoverage;
    coveredLength += segmentCoveredLength;
    if (segmentCoverage + EPSILON < options.linkedCoverageRatio || mergedCoverage.unresolvedGapCount > 0) unmatchedSegmentIndexes.push(index);
    let segmentStatus: RoomBoundarySegmentStatus;
    if (mergedCoverage.unresolvedGapCount > 0) segmentStatus = "COVERAGE_GAP";
    else if (segmentCoverage + EPSILON >= options.linkedCoverageRatio) segmentStatus = "MATCHED";
    else if (segmentCoverage > EPSILON) segmentStatus = "PARTIAL";
    else if (
      nearestParallel &&
      parallelCandidates.filter((candidate) => Math.abs(candidate.distance - nearestParallel.distance) <= 1).length > 1
    ) segmentStatus = "AMBIGUOUS_CANDIDATES";
    else if (
      nearestParallel &&
      nearestParallel.distance <= options.boundaryDistanceTolerancePx * 4
    ) segmentStatus = "OFFSET_TOO_LARGE";
    else segmentStatus = "MISSING_BOUNDARY_WALL";
    const diagnosticNearest = segmentStatus === "MISSING_BOUNDARY_WALL"
      ? nearestAny
      : nearestParallel ?? nearestAny;
    candidateTraces.sort((first, second) =>
      Number(first.rejectionReason !== "MATCHED") - Number(second.rejectionReason !== "MATCHED") ||
      first.segmentDistancePx - second.segmentDistancePx ||
      first.sourceWallId.localeCompare(second.sourceWallId));
    segments.push({
      segmentIndex: index,
      segmentLengthPx: length,
      coveredLengthPx: segmentCoveredLength,
      coverageRatio: segmentCoverage,
      matchedSourceWallIds: [...matchedWallIds].sort(),
      nearestWallId: diagnosticNearest?.wallId ?? null,
      nearestWallDistancePx: diagnosticNearest && Number.isFinite(diagnosticNearest.distance) ? diagnosticNearest.distance : null,
      nearestWallAngleDifferenceDegrees: diagnosticNearest?.angle ?? null,
      status: segmentStatus,
      trace: {
        normalizedStart: { ...start },
        normalizedEnd: { ...end },
        pixelStart: { ...roomEdge.start },
        pixelEnd: { ...roomEdge.end },
        candidates: candidateTraces,
        sourceCandidates: sourceCandidateTraces,
        derivedCandidates: candidateTraces,
        compatibleSourceWallIds: [...new Set(sourceCandidateTraces.filter((candidate) => candidate.rejectionReason === "MATCHED").map((candidate) => candidate.sourceWallId))].sort(),
        compatibleDerivedEdgeIds: candidateTraces.filter((candidate) => candidate.rejectionReason === "MATCHED" && candidate.derivedEdgeId).map((candidate) => candidate.derivedEdgeId as string).sort(),
      },
    });
  }
  const coverageRatio = totalLength > EPSILON ? Math.min(1, coveredLength / totalLength) : 0;
  return {
    roomId: room.id,
    wallIds: [...wallIds].sort(),
    closed: room.vertices.length >= 3 && coverageRatio + EPSILON >= options.linkedCoverageRatio,
    coverageRatio,
    unmatchedSegmentCount: unmatchedSegmentIndexes.length,
    unmatchedSegmentIndexes,
    segments,
    status: roomStatus(coverageRatio, options.linkedCoverageRatio, options.partialCoverageRatio),
  };
}

export function buildArchitecturalGraph(markup: ImportedPlanMarkup, inputOptions: ArchitecturalGraphOptions): ArchitecturalGraph {
  if (!finitePositive(inputOptions.imageWidthPx) || !finitePositive(inputOptions.imageHeightPx)) {
    return {
      nodes: [], edges: [], roomBoundaries: [], diagnostics: [], wallInventory: [],
      runtimeTrace: {
        functionReceivedWallCount: markup.walls.length,
        functionReceivedWallIds: markup.walls.map((wall) => wall.id),
        sourceWallCount: 0,
        sourceWallIds: [],
        derivedSegmentCount: 0,
        nodeCount: 0,
        edgeCount: 0,
      },
    };
  }
  const options: Required<ArchitecturalGraphOptions> = { ...DEFAULT_ARCHITECTURAL_GRAPH_OPTIONS, ...inputOptions };
  const walls = [...markup.walls].sort((a, b) => a.id.localeCompare(b.id));
  const nodes: ArchitecturalNode[] = [];
  const endpointNodes = new Map<string, string>();
  const splitPoints = new Map<string, SplitPoint[]>();

  const findNearestNode = (pixel: PixelPoint) => {
    let nearest: { node: ArchitecturalNode; distance: number } | null = null;
    for (const node of nodes) {
      const candidateDistance = distance(pixel, toPixel(node.point, options.imageWidthPx, options.imageHeightPx));
      if (candidateDistance > options.endpointTolerancePx) continue;
      if (!nearest || candidateDistance < nearest.distance - EPSILON ||
        (Math.abs(candidateDistance - nearest.distance) <= EPSILON && node.id < nearest.node.id)) nearest = { node, distance: candidateDistance };
    }
    return nearest?.node ?? null;
  };
  const createNode = (point: NormalizedPoint2D) => {
    const node: ArchitecturalNode = { id: `N${String(nodes.length + 1).padStart(3, "0")}`, point: { ...point }, wallIds: [], edgeIds: [] };
    nodes.push(node);
    return node;
  };

  for (const wall of walls) {
    for (const endpoint of ["start", "end"] as const) {
      const point = wall[endpoint];
      const node = findNearestNode(toPixel(point, options.imageWidthPx, options.imageHeightPx)) ?? createNode(point);
      if (!node.wallIds.includes(wall.id)) node.wallIds.push(wall.id);
      endpointNodes.set(`${wall.id}:${endpoint}`, node.id);
    }
  }
  for (const wall of walls) {
    splitPoints.set(wall.id, [
      { position: 0, nodeId: endpointNodes.get(`${wall.id}:start`) ?? "" },
      { position: 1, nodeId: endpointNodes.get(`${wall.id}:end`) ?? "" },
    ]);
  }

  for (const touchingWall of walls) {
    for (const endpoint of ["start", "end"] as const) {
      const endpointNodeId = endpointNodes.get(`${touchingWall.id}:${endpoint}`);
      const endpointNode = nodes.find((node) => node.id === endpointNodeId);
      if (!endpointNode) continue;
      const endpointPixel = toPixel(touchingWall[endpoint], options.imageWidthPx, options.imageHeightPx);
      for (const hostWall of walls) {
        if (hostWall.id === touchingWall.id) continue;
        const hostSegment = wallSegment(hostWall, options.imageWidthPx, options.imageHeightPx);
        const projection = projectPointToSegment(endpointPixel, hostSegment);
        const hostLength = segmentLength(hostSegment);
        if (!projection || hostLength <= options.degenerateWallTolerancePx) continue;
        const endpointMargin = options.endpointTolerancePx / hostLength;
        if (projection.unclampedPosition <= endpointMargin || projection.unclampedPosition >= 1 - endpointMargin || projection.distancePixels > options.endpointTolerancePx) continue;
        const existing = splitPoints.get(hostWall.id) ?? [];
        const duplicate = existing.some((item) => {
          const node = nodes.find((candidate) => candidate.id === item.nodeId);
          return node && distance(toPixel(node.point, options.imageWidthPx, options.imageHeightPx), projection.point) <= options.endpointTolerancePx;
        });
        if (duplicate) continue;
        existing.push({ position: projection.position, nodeId: endpointNode.id });
        splitPoints.set(hostWall.id, existing);
        if (!endpointNode.wallIds.includes(hostWall.id)) endpointNode.wallIds.push(hostWall.id);
      }
    }
  }

  const edges: ArchitecturalWallEdge[] = [];
  const derivedWalls: DerivedWallGeometry[] = [];
  for (const wall of walls) {
    const sourceSegment = wallSegment(wall, options.imageWidthPx, options.imageHeightPx);
    const points = [...(splitPoints.get(wall.id) ?? [])]
      .sort((a, b) => a.position - b.position || a.nodeId.localeCompare(b.nodeId))
      .filter((point, index, all) => index === 0 || Math.abs(point.position - (all[index - 1]?.position ?? -1)) > EPSILON);
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index];
      const end = points[index + 1];
      if (!start || !end || end.position - start.position <= EPSILON) continue;
      const id = `${wall.id}:segment:${String(index + 1).padStart(2, "0")}`;
      const isLastSegment = index === points.length - 2;
      const openingIds = markup.openings
        .filter((opening) => opening.wallId === wall.id && opening.position + EPSILON >= start.position &&
          (isLastSegment ? opening.position - EPSILON <= end.position : opening.position < end.position - EPSILON))
        .map((opening) => opening.id);
      const edge: ArchitecturalWallEdge = { id, wallId: wall.id, sourceWallId: wall.id, startNodeId: start.nodeId, endNodeId: end.nodeId, openingIds };
      edges.push(edge);
      for (const nodeId of [edge.startNodeId, edge.endNodeId]) {
        const node = nodes.find((candidate) => candidate.id === nodeId);
        if (node && !node.edgeIds.includes(edge.id)) node.edgeIds.push(edge.id);
      }
      const pointAt = (position: number) => ({
        x: sourceSegment.start.x + (sourceSegment.end.x - sourceSegment.start.x) * position,
        y: sourceSegment.start.y + (sourceSegment.end.y - sourceSegment.start.y) * position,
      });
      derivedWalls.push({ edge, segment: { start: pointAt(start.position), end: pointAt(end.position) } });
    }
  }

  const sourceWalls: SourceWallGeometry[] = walls.map((wall) => ({
    sourceWallId: wall.id,
    segment: wallSegment(wall, options.imageWidthPx, options.imageHeightPx),
  }));
  const wallInventory: ArchitecturalSourceWallInventory[] = sourceWalls.map((sourceWall) => ({
    sourceWallId: sourceWall.sourceWallId,
    normalizedStart: toNormalized(sourceWall.segment.start, options.imageWidthPx, options.imageHeightPx),
    normalizedEnd: toNormalized(sourceWall.segment.end, options.imageWidthPx, options.imageHeightPx),
    pixelStart: { ...sourceWall.segment.start },
    pixelEnd: { ...sourceWall.segment.end },
    sourceLengthPx: segmentLength(sourceWall.segment),
    orientation: wallOrientation(sourceWall.segment),
    derivedSegments: derivedWalls
      .filter((derivedWall) => derivedWall.edge.sourceWallId === sourceWall.sourceWallId)
      .map((derivedWall) => ({
        id: derivedWall.edge.id,
        startNodeId: derivedWall.edge.startNodeId,
        endNodeId: derivedWall.edge.endNodeId,
        pixelStart: { ...derivedWall.segment.start },
        pixelEnd: { ...derivedWall.segment.end },
      })),
  }));
  const roomBoundaries = markup.rooms.map((room) => matchRoomBoundary(room, sourceWalls, derivedWalls, options));
  const diagnostics: ArchitecturalDiagnostic[] = [];
  for (const node of nodes) {
    if (getNodeDegree(node) === 1) diagnostics.push({ id: `dangling:${node.id}`, code: "DANGLING_NODE", nodeId: node.id, message: `Свободный конец стены · узел ${node.id}` });
  }
  for (const wall of walls) {
    const sourceEdges = edges.filter((edge) => edge.sourceWallId === wall.id);
    const length = segmentLength(wallSegment(wall, options.imageWidthPx, options.imageHeightPx));
    if (length <= options.degenerateWallTolerancePx) diagnostics.push({ id: `degenerate:${wall.id}`, code: "DEGENERATE_WALL", wallId: wall.id, message: `Стена ${wall.id} имеет нулевую или слишком малую длину` });
    const endpointDegrees = [nodes.find((node) => node.id === endpointNodes.get(`${wall.id}:start`)), nodes.find((node) => node.id === endpointNodes.get(`${wall.id}:end`))]
      .map((node) => node ? getNodeDegree(node) : 0);
    if (sourceEdges.length === 1 && endpointDegrees.every((degree) => degree === 1)) diagnostics.push({ id: `isolated:${wall.id}`, code: "ISOLATED_WALL", wallId: wall.id, message: `Изолированная стена · ${wall.id}` });
  }
  for (let index = 0; index < walls.length; index += 1) {
    const wall = walls[index];
    if (!wall) continue;
    const wallStart = endpointNodes.get(`${wall.id}:start`);
    const wallEnd = endpointNodes.get(`${wall.id}:end`);
    for (const candidate of walls.slice(index + 1)) {
      const candidateStart = endpointNodes.get(`${candidate.id}:start`);
      const candidateEnd = endpointNodes.get(`${candidate.id}:end`);
      const duplicate = (wallStart === candidateStart && wallEnd === candidateEnd) || (wallStart === candidateEnd && wallEnd === candidateStart);
      if (duplicate) diagnostics.push({ id: `duplicate:${wall.id}:${candidate.id}`, code: "DUPLICATE_WALL", wallId: candidate.id, message: `Дублирующиеся стены · ${wall.id} и ${candidate.id}` });
    }
  }
  for (const opening of markup.openings) {
    const wall = walls.find((item) => item.id === opening.wallId);
    if (!wall) diagnostics.push({ id: `orphan:${opening.id}`, code: "ORPHAN_OPENING", openingId: opening.id, message: `Проём без стены · ${opening.id}` });
    else if (markup.calibration && !canOpeningFitOnWall(wall, opening.position, opening.widthMeters, markup.calibration)) diagnostics.push({ id: `opening-fit:${opening.id}`, code: "OPENING_FIT_INVALID", openingId: opening.id, wallId: wall.id, message: `Проём ${opening.id} не помещается на стене` });
  }
  for (const boundary of roomBoundaries) {
    if (!boundary.closed) diagnostics.push({ id: `room-boundary:${boundary.roomId}`, code: "ROOM_BOUNDARY_INCOMPLETE", roomId: boundary.roomId, message: `Комната ${boundary.roomId} · неполная граница` });
  }
  return {
    nodes,
    edges,
    roomBoundaries,
    diagnostics,
    wallInventory,
    runtimeTrace: {
      functionReceivedWallCount: markup.walls.length,
      functionReceivedWallIds: markup.walls.map((wall) => wall.id),
      sourceWallCount: sourceWalls.length,
      sourceWallIds: sourceWalls.map((wall) => wall.sourceWallId),
      derivedSegmentCount: derivedWalls.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
  };
}
