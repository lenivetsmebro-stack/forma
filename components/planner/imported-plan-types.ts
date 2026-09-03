export type Point2D = {
  x: number;
  y: number;
};

/** Coordinates relative to the source image: 0,0 top-left; 1,1 bottom-right. */
export type NormalizedPoint2D = Point2D;

export type PlanScaleCalibration = {
  pointA: NormalizedPoint2D;
  pointB: NormalizedPoint2D;
  realLengthMeters: number;
  imageDistance: number;
  metersPerNormalizedUnit: number;
};

export type ImportedWall = {
  id: string;
  start: NormalizedPoint2D;
  end: NormalizedPoint2D;
};

export type ImportedPlanMarkup = {
  fileSessionId: string;
  calibrationPoints: NormalizedPoint2D[];
  calibration: PlanScaleCalibration | null;
  walls: ImportedWall[];
};

export type ImportedOpeningType = "door" | "window";

export type ImportedOpening = {
  id: string;
  type: ImportedOpeningType;
  wallId: string;
  width: number;
  height?: number;
  offset: number;
  sillHeight?: number;
};

export type ImportedRoom = {
  id: string;
  name?: string;
  polygon: Point2D[];
  ceilingHeight?: number;
  doors: ImportedOpening[];
  windows: ImportedOpening[];
};

export type ImportedFloorPlan = {
  sourceType: "image" | "pdf";
  fileName: string;
  planScale?: number;
  defaultCeilingHeight?: number;
  rooms: ImportedRoom[];
};

export type ImportValidationCode =
  | "MISSING_SCALE"
  | "INVALID_CEILING_HEIGHT"
  | "INVALID_ROOM_POLYGON"
  | "INVALID_OPENING"
  | "MISSING_WALL_REFERENCE"
  | "NO_ROOMS";

export type ImportValidationIssue = {
  code: ImportValidationCode;
  message: string;
  roomId?: string;
  openingId?: string;
};

export type ImportValidationResult = {
  valid: boolean;
  errors: ImportValidationIssue[];
  warnings: ImportValidationIssue[];
};
