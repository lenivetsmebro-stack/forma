"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

import type {
  ImportedMarkupOpening,
  ImportedOpeningType,
  ImportedPlanMarkup,
  ImportedRoomPolygon,
  ImportedWall,
  NormalizedPoint2D,
} from "@/components/planner/imported-plan-types";
import {
  arePointsNear,
  createScaleCalibration,
  canOpeningFitOnWall,
  getContainedImageRect,
  getNearestWallHit,
  getNormalizedPoint,
  getOpeningPixelSpan,
  getPolygonCentroid,
  getRoomAreaMeters2,
  getRoomPerimeterMeters,
  getTotalRoomAreaMeters2,
  getTotalWallLengthMeters,
  getWallLengthMeters,
  isSelfIntersectingPolygon,
  isValidRoomPolygon,
  removeWallWithOpenings,
  type Rect2D,
  type Size2D,
} from "@/components/planner/plan-markup-utils";

type MarkupMode = "walls" | "rooms" | "openings";

const OPENING_DEFAULTS: Record<ImportedOpeningType, Pick<ImportedMarkupOpening, "widthMeters" | "heightMeters" | "sillHeightMeters">> = {
  door: { widthMeters: 0.8, heightMeters: 2, sillHeightMeters: 0 },
  window: { widthMeters: 1.2, heightMeters: 1.4, sillHeightMeters: 0.8 },
};

type PlanMarkupStepProps = {
  fileName: string;
  previewUrl: string;
  markup: ImportedPlanMarkup;
  realLengthInput: string;
  onRealLengthChange: (value: string) => void;
  onMarkupChange: (markup: ImportedPlanMarkup) => void;
  onBack: () => void;
};

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

function formatLength(value: number | null) {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${numberFormatter.format(value)} м`;
}

function formatArea(value: number | null) {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${numberFormatter.format(value)} м²`;
}

function getNextEntityNumber(ids: string[], marker: string) {
  return Math.max(
    0,
    ...ids.map((id) => {
      const match = id.match(new RegExp(`${marker}-(\\d+)$`));
      return match?.[1] ? Number(match[1]) : 0;
    }),
  ) + 1;
}

export function PlanMarkupStep({
  fileName,
  previewUrl,
  markup,
  realLengthInput,
  onRealLengthChange,
  onMarkupChange,
  onBack,
}: PlanMarkupStepProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [intrinsicSize, setIntrinsicSize] = useState<Size2D | null>(null);
  const [workspaceSize, setWorkspaceSize] = useState<Size2D | null>(null);
  const [markupMode, setMarkupMode] = useState<MarkupMode>("walls");
  const [draftWallStart, setDraftWallStart] = useState<NormalizedPoint2D | null>(null);
  const [draftRoomVertices, setDraftRoomVertices] = useState<NormalizedPoint2D[]>([]);
  const [openingType, setOpeningType] = useState<ImportedOpeningType>("door");
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const [geometryMessage, setGeometryMessage] = useState("");

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setWorkspaceSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(workspace);
    return () => observer.disconnect();
  }, []);

  const localImageRect = useMemo(() => {
    if (!workspaceSize || !intrinsicSize) return null;
    return getContainedImageRect(
      { left: 0, top: 0, ...workspaceSize },
      intrinsicSize,
    );
  }, [intrinsicSize, workspaceSize]);

  const calibration = markup.calibration;
  const lengthValue = Number(realLengthInput);
  const canConfirmCalibration =
    markup.calibrationPoints.length === 2 &&
    intrinsicSize !== null &&
    Number.isFinite(lengthValue) &&
    lengthValue > 0;
  const totalWallLength = calibration
    ? getTotalWallLengthMeters(markup.walls, calibration)
    : null;
  const totalRoomArea = calibration
    ? getTotalRoomAreaMeters2(markup.rooms, calibration)
    : null;
  const markerRadius = intrinsicSize
    ? Math.min(intrinsicSize.width, intrinsicSize.height) * 0.012
    : 0;
  const imageWidth = intrinsicSize?.width ?? 1;
  const imageHeight = intrinsicSize?.height ?? 1;
  const selectedOpening = markup.openings.find((opening) => opening.id === selectedOpeningId) ?? null;

  function x(point: NormalizedPoint2D) {
    return point.x * imageWidth;
  }

  function y(point: NormalizedPoint2D) {
    return point.y * imageHeight;
  }

  function polygonPoints(vertices: NormalizedPoint2D[]) {
    return vertices.map((point) => `${x(point)},${y(point)}`).join(" ");
  }

  function getPointFromPointer(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const imageRect: Rect2D = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    return getNormalizedPoint({ x: event.clientX, y: event.clientY }, imageRect);
  }

  function addCalibrationPoint(point: NormalizedPoint2D) {
    if (markup.calibrationPoints.length >= 2) return;
    onMarkupChange({
      ...markup,
      calibrationPoints: [...markup.calibrationPoints, point],
    });
  }

  function addWallPoint(point: NormalizedPoint2D) {
    if (!draftWallStart) {
      setDraftWallStart(point);
      return;
    }
    if (!intrinsicSize || arePointsNear(draftWallStart, point, intrinsicSize)) {
      setGeometryMessage("Конечная точка стены находится слишком близко к начальной.");
      return;
    }
    const nextNumber = getNextEntityNumber(markup.walls.map((wall) => wall.id), "wall");
    const wall: ImportedWall = {
      id: `${markup.fileSessionId}-wall-${nextNumber}`,
      start: draftWallStart,
      end: point,
    };
    onMarkupChange({ ...markup, walls: [...markup.walls, wall] });
    setDraftWallStart(null);
    setGeometryMessage("");
  }

  function addRoomVertex(point: NormalizedPoint2D) {
    const previous = draftRoomVertices.at(-1);
    if (previous && intrinsicSize && arePointsNear(previous, point, intrinsicSize)) {
      setGeometryMessage("Новая вершина находится слишком близко к предыдущей.");
      return;
    }
    setDraftRoomVertices((current) => [...current, point]);
    setGeometryMessage("");
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const point = getPointFromPointer(event);
    if (!point) return;
    if (!calibration) {
      addCalibrationPoint(point);
    } else if (markupMode === "walls") {
      addWallPoint(point);
    } else if (markupMode === "rooms") {
      addRoomVertex(point);
    } else if (intrinsicSize) {
      const renderedWidth = event.currentTarget.getBoundingClientRect().width;
      const hitThreshold = renderedWidth > 0 ? 14 * intrinsicSize.width / renderedWidth : 14;
      const hit = getNearestWallHit(point, markup.walls, intrinsicSize, hitThreshold);
      if (!hit) {
        setGeometryMessage("Выберите точку ближе к размеченной стене.");
        return;
      }
      const wall = markup.walls.find((item) => item.id === hit.wallId);
      const defaults = OPENING_DEFAULTS[openingType];
      if (!wall || !canOpeningFitOnWall(wall, hit.position, defaults.widthMeters, calibration)) {
        setGeometryMessage("Проём с выбранной шириной не помещается в этой точке стены.");
        return;
      }
      const nextNumber = getNextEntityNumber(markup.openings.map((opening) => opening.id), "opening");
      const opening: ImportedMarkupOpening = {
        id: `${markup.fileSessionId}-opening-${nextNumber}`,
        type: openingType,
        wallId: wall.id,
        position: hit.position,
        ...defaults,
      };
      onMarkupChange({ ...markup, openings: [...markup.openings, opening] });
      setSelectedOpeningId(opening.id);
      setGeometryMessage("Проём добавлен. Размеры можно уточнить ниже.");
    }
  }

  function confirmCalibration() {
    const [pointA, pointB] = markup.calibrationPoints;
    if (!pointA || !pointB || !intrinsicSize) return;
    const nextCalibration = createScaleCalibration(
      pointA,
      pointB,
      lengthValue,
      intrinsicSize,
    );
    if (!nextCalibration) return;
    onMarkupChange({ ...markup, calibration: nextCalibration });
    setGeometryMessage("");
  }

  function resetCalibration() {
    onMarkupChange({ ...markup, calibrationPoints: [], calibration: null });
    setDraftWallStart(null);
    onRealLengthChange("");
    setGeometryMessage(
      markup.walls.length > 0 || markup.rooms.length > 0 || markup.openings.length > 0
        ? "Требуется повторная калибровка масштаба. Геометрия сохранена."
        : "",
    );
  }

  function closeRoom() {
    if (!calibration || draftRoomVertices.length < 3) return;
    if (isSelfIntersectingPolygon(draftRoomVertices)) {
      setGeometryMessage("Контур пересекает сам себя. Исправьте точки помещения.");
      return;
    }
    if (!isValidRoomPolygon(draftRoomVertices, calibration)) {
      setGeometryMessage("Контур помещения имеет недостаточную площадь. Проверьте его точки.");
      return;
    }
    const nextNumber = getNextEntityNumber(markup.rooms.map((room) => room.id), "room");
    const room: ImportedRoomPolygon = {
      id: `${markup.fileSessionId}-room-${nextNumber}`,
      name: `Помещение ${nextNumber}`,
      vertices: draftRoomVertices.map((point) => ({ ...point })),
    };
    onMarkupChange({ ...markup, rooms: [...markup.rooms, room] });
    setDraftRoomVertices([]);
    setGeometryMessage("");
  }

  function updateRoomName(roomId: string, name: string) {
    onMarkupChange({
      ...markup,
      rooms: markup.rooms.map((room) => room.id === roomId ? { ...room, name } : room),
    });
  }

  function finalizeRoomName(room: ImportedRoomPolygon) {
    const fallbackNumber = markup.rooms.findIndex((item) => item.id === room.id) + 1;
    updateRoomName(room.id, room.name.trim() || `Помещение ${fallbackNumber}`);
  }

  function handleRoomNameKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    room: ImportedRoomPolygon,
  ) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      finalizeRoomName(room);
      event.currentTarget.blur();
    }
  }

  function removeWall(wallId: string) {
    onMarkupChange(removeWallWithOpenings(markup, wallId));
    if (selectedOpening?.wallId === wallId) setSelectedOpeningId(null);
  }

  function removeRoom(roomId: string) {
    onMarkupChange({ ...markup, rooms: markup.rooms.filter((room) => room.id !== roomId) });
  }

  function removeOpening(openingId: string) {
    onMarkupChange({ ...markup, openings: markup.openings.filter((opening) => opening.id !== openingId) });
    if (selectedOpeningId === openingId) setSelectedOpeningId(null);
  }

  function updateOpening(openingId: string, patch: Partial<ImportedMarkupOpening>) {
    const current = markup.openings.find((opening) => opening.id === openingId);
    if (!current || !calibration) return;
    const next = { ...current, ...patch };
    const wall = markup.walls.find((item) => item.id === next.wallId);
    if (
      !wall || !Number.isFinite(next.heightMeters) || next.heightMeters <= 0 ||
      !Number.isFinite(next.sillHeightMeters) || next.sillHeightMeters < 0 ||
      !canOpeningFitOnWall(wall, next.position, next.widthMeters, calibration)
    ) {
      setGeometryMessage("Проверьте размеры и положение: проём должен полностью помещаться на стене.");
      return;
    }
    onMarkupChange({
      ...markup,
      openings: markup.openings.map((opening) => opening.id === openingId ? next : opening),
    });
    setGeometryMessage("");
  }

  return (
    <section className="plan-markup" aria-labelledby="plan-markup-title">
      <header className="plan-markup__header">
        <span aria-hidden="true">05C.4</span>
        <div>
          <p className="section-label">Разметка планировки</p>
          <h2 id="plan-markup-title">Масштаб, стены, помещения и проёмы</h2>
          <p>
            Отметьте геометрию поверх изображения. Все точки сохраняются в
            нормализованной системе координат и остаются на месте при resize.
          </p>
        </div>
      </header>

      <div className="plan-markup__layout">
        <div className="plan-markup__main">
          <div className="plan-markup__instructions">
            <p className="section-label">
              {!calibration
                ? "1. Определите масштаб"
                : markupMode === "walls"
                  ? "2. Разметьте стены"
                  : markupMode === "rooms"
                    ? "3. Сформируйте помещения"
                    : "4. Добавьте проёмы"}
            </p>
            <p>
              {!calibration
                ? "Выберите две точки на отрезке, длина которого вам известна."
                : markupMode === "walls"
                  ? "Последовательно выберите начало и конец каждой стены."
                  : markupMode === "rooms"
                    ? "Отмечайте углы помещения по порядку, затем явно замкните контур."
                    : "Выберите тип, затем нажмите рядом с нужной стеной, чтобы разместить проём."}
            </p>
          </div>

          {calibration && (
            <div className="plan-markup__mode" role="group" aria-label="Режим разметки">
              <button type="button" aria-pressed={markupMode === "walls"} onClick={() => setMarkupMode("walls")}>
                Стены
              </button>
              <button type="button" aria-pressed={markupMode === "rooms"} onClick={() => setMarkupMode("rooms")}>
                Помещения
              </button>
              <button type="button" aria-pressed={markupMode === "openings"} onClick={() => setMarkupMode("openings")}>
                Проёмы
              </button>
            </div>
          )}

          <div className="plan-markup__workspace" ref={workspaceRef}>
            <Image
              src={previewUrl}
              alt={`Планировка для разметки: ${fileName}`}
              fill
              sizes="(max-width: 1023px) 100vw, 68vw"
              unoptimized
              onLoad={(event) => setIntrinsicSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })}
            />
            {localImageRect && (
              <svg
                className="plan-markup__overlay"
                style={{
                  left: localImageRect.left,
                  top: localImageRect.top,
                  width: localImageRect.width,
                  height: localImageRect.height,
                }}
                viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                role="group"
                aria-label={!calibration ? "Область выбора масштаба" : `Область разметки: ${markupMode === "walls" ? "стены" : "помещения"}`}
                onPointerDown={handlePointerDown}
              >
                <g className="plan-markup__saved-room-fills">
                  {markup.rooms.map((room) => (
                    <polygon key={`fill-${room.id}`} points={polygonPoints(room.vertices)} />
                  ))}
                </g>
                {markup.walls.map((wall) => (
                  <g key={wall.id} className="plan-markup__wall">
                    <line x1={x(wall.start)} y1={y(wall.start)} x2={x(wall.end)} y2={y(wall.end)} />
                    <circle cx={x(wall.start)} cy={y(wall.start)} r={markerRadius * 0.65} />
                    <circle cx={x(wall.end)} cy={y(wall.end)} r={markerRadius * 0.65} />
                  </g>
                ))}
                {calibration && markup.openings.map((opening) => {
                  const wall = markup.walls.find((item) => item.id === opening.wallId);
                  const span = wall ? getOpeningPixelSpan(opening, wall, calibration) : null;
                  if (!span) return null;
                  return (
                    <g
                      key={opening.id}
                      className={`plan-markup__opening plan-markup__opening--${opening.type}${selectedOpeningId === opening.id ? " is-selected" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Выбрать ${opening.type === "door" ? "дверь" : "окно"}`}
                      onPointerDown={(event) => { event.stopPropagation(); setSelectedOpeningId(opening.id); }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedOpeningId(opening.id);
                        }
                      }}
                    >
                      <line className="plan-markup__opening-hit" x1={x(span.start)} y1={y(span.start)} x2={x(span.end)} y2={y(span.end)} />
                      <line className="plan-markup__opening-base" x1={x(span.start)} y1={y(span.start)} x2={x(span.end)} y2={y(span.end)} />
                      <line className="plan-markup__opening-mark" x1={x(span.start)} y1={y(span.start)} x2={x(span.end)} y2={y(span.end)} />
                    </g>
                  );
                })}
                <g className="plan-markup__saved-room-outlines">
                  {markup.rooms.map((room) => {
                    const centroid = getPolygonCentroid(room.vertices);
                    const area = calibration ? getRoomAreaMeters2(room, calibration) : null;
                    return (
                      <g key={`outline-${room.id}`}>
                        <polygon points={polygonPoints(room.vertices)} />
                        {centroid && (
                          <text x={x(centroid)} y={y(centroid)}>
                            <tspan x={x(centroid)} dy="0">{room.name || "Помещение"}</tspan>
                            <tspan x={x(centroid)} dy="1.25em">{formatArea(area)}</tspan>
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
                {markupMode === "rooms" && draftRoomVertices.length > 0 && (
                  <g className="plan-markup__room-draft">
                    <polyline points={polygonPoints(draftRoomVertices)} />
                    {draftRoomVertices.map((point, index) => (
                      <g key={`room-draft-${index}`}>
                        <circle cx={x(point)} cy={y(point)} r={markerRadius} />
                        <text x={x(point)} y={y(point)} dx={markerRadius * 1.4} dy={-markerRadius * 1.4}>{index + 1}</text>
                      </g>
                    ))}
                  </g>
                )}
                {markup.calibrationPoints.length === 2 && (
                  <line
                    className="plan-markup__calibration-line"
                    x1={x(markup.calibrationPoints[0] as NormalizedPoint2D)}
                    y1={y(markup.calibrationPoints[0] as NormalizedPoint2D)}
                    x2={x(markup.calibrationPoints[1] as NormalizedPoint2D)}
                    y2={y(markup.calibrationPoints[1] as NormalizedPoint2D)}
                  />
                )}
                {markup.calibrationPoints.map((point, index) => (
                  <g key={`calibration-${index}`} className="plan-markup__calibration-point">
                    <circle cx={x(point)} cy={y(point)} r={markerRadius} />
                    <text x={x(point)} y={y(point)} dx={markerRadius * 1.4} dy={-markerRadius * 1.4}>{index === 0 ? "A" : "B"}</text>
                  </g>
                ))}
                {markupMode === "walls" && draftWallStart && (
                  <g className="plan-markup__draft-point">
                    <circle cx={x(draftWallStart)} cy={y(draftWallStart)} r={markerRadius} />
                    <text x={x(draftWallStart)} y={y(draftWallStart)} dx={markerRadius * 1.4} dy={-markerRadius * 1.4}>A</text>
                  </g>
                )}
              </svg>
            )}
          </div>

          <p className="plan-markup__message" aria-live="polite">{geometryMessage}</p>

          {!calibration ? (
            <div className="plan-markup__calibration-controls">
              <div className="field">
                <label htmlFor="calibration-length">Фактическая длина</label>
                <div className="field__control">
                  <input id="calibration-length" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="3.05" value={realLengthInput} onChange={(event) => onRealLengthChange(event.target.value)} />
                  <span>м</span>
                </div>
              </div>
              <button className="button button--primary" type="button" disabled={!canConfirmCalibration} onClick={confirmCalibration}>Подтвердить масштаб</button>
              <button className="button button--secondary" type="button" disabled={markup.calibrationPoints.length === 0} onClick={resetCalibration}>Сбросить точки</button>
            </div>
          ) : markupMode === "walls" ? (
            <div className="plan-markup__wall-controls">
              <p>{draftWallStart ? "Выберите конечную точку стены." : "Выберите начальную точку стены."}</p>
              <button className="button button--secondary" type="button" disabled={!draftWallStart} onClick={() => setDraftWallStart(null)}>Отменить точку стены</button>
              <button className="button button--secondary" type="button" disabled={markup.walls.length === 0} onClick={() => { const wall = markup.walls.at(-1); if (wall) removeWall(wall.id); }}>Удалить последнюю стену</button>
              <button className="button button--secondary" type="button" disabled={markup.walls.length === 0} onClick={() => { onMarkupChange({ ...markup, walls: [], openings: [] }); setDraftWallStart(null); setSelectedOpeningId(null); }}>Очистить стены</button>
              <button className="plan-markup__reset-scale" type="button" onClick={resetCalibration}>Сбросить масштаб</button>
            </div>
          ) : markupMode === "rooms" ? (
            <div className="plan-markup__room-controls">
              <p>Точек: <strong>{draftRoomVertices.length}</strong></p>
              <button className="button button--secondary" type="button" disabled={draftRoomVertices.length === 0} onClick={() => setDraftRoomVertices((current) => current.slice(0, -1))}>Отменить последнюю точку</button>
              <button className="button button--secondary" type="button" disabled={draftRoomVertices.length === 0} onClick={() => { setDraftRoomVertices([]); setGeometryMessage(""); }}>Сбросить контур</button>
              <button className="button button--primary" type="button" disabled={draftRoomVertices.length < 3} onClick={closeRoom}>Замкнуть помещение</button>
              <button className="plan-markup__reset-scale" type="button" onClick={resetCalibration}>Сбросить масштаб</button>
            </div>
          ) : (
            <div className="plan-markup__opening-controls">
              <div className="plan-markup__opening-type" role="group" aria-label="Тип нового проёма">
                <button type="button" aria-pressed={openingType === "door"} onClick={() => setOpeningType("door")}>Дверь</button>
                <button type="button" aria-pressed={openingType === "window"} onClick={() => setOpeningType("window")}>Окно</button>
              </div>
              <p>Выберите стену и укажите положение проёма. Новый проём создаётся с безопасными базовыми размерами.</p>
              {selectedOpening && (() => {
                const wall = markup.walls.find((item) => item.id === selectedOpening.wallId);
                const wallLength = wall && calibration ? getWallLengthMeters(wall, calibration) : null;
                const edgePercent = wallLength && wallLength > 0
                  ? Math.min(50, selectedOpening.widthMeters / 2 / wallLength * 100)
                  : 0;
                const wallNumber = Math.max(0, markup.walls.findIndex((item) => item.id === selectedOpening.wallId)) + 1;
                return (
                  <div className="plan-markup__opening-editor">
                    <header>
                      <div><span>Выбранный проём</span><strong>{selectedOpening.type === "door" ? "Дверь" : "Окно"} · стена {String(wallNumber).padStart(2, "0")}</strong></div>
                      <button type="button" onClick={() => removeOpening(selectedOpening.id)}>Удалить</button>
                    </header>
                    <div className="plan-markup__opening-type" role="group" aria-label="Изменить тип проёма">
                      <button type="button" aria-pressed={selectedOpening.type === "door"} onClick={() => updateOpening(selectedOpening.id, { type: "door", ...OPENING_DEFAULTS.door })}>Дверь</button>
                      <button type="button" aria-pressed={selectedOpening.type === "window"} onClick={() => updateOpening(selectedOpening.id, { type: "window", ...OPENING_DEFAULTS.window })}>Окно</button>
                    </div>
                    <div className="plan-markup__opening-fields">
                      <label>Ширина, м<input key={`${selectedOpening.id}-width-${selectedOpening.widthMeters}`} type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={selectedOpening.widthMeters} onBlur={(event) => updateOpening(selectedOpening.id, { widthMeters: Number(event.currentTarget.value) })} /></label>
                      <label>Высота, м<input key={`${selectedOpening.id}-height-${selectedOpening.heightMeters}`} type="number" min="0.01" step="0.01" inputMode="decimal" defaultValue={selectedOpening.heightMeters} onBlur={(event) => updateOpening(selectedOpening.id, { heightMeters: Number(event.currentTarget.value) })} /></label>
                      {selectedOpening.type === "window" && <label>Подоконник, м<input key={`${selectedOpening.id}-sill-${selectedOpening.sillHeightMeters}`} type="number" min="0" step="0.01" inputMode="decimal" defaultValue={selectedOpening.sillHeightMeters} onBlur={(event) => updateOpening(selectedOpening.id, { sillHeightMeters: Number(event.currentTarget.value) })} /></label>}
                    </div>
                    <label className="plan-markup__opening-position">
                      Положение вдоль стены: {numberFormatter.format(selectedOpening.position * 100)}%
                      <input type="range" min={edgePercent} max={100 - edgePercent} step="0.1" value={selectedOpening.position * 100} onChange={(event) => updateOpening(selectedOpening.id, { position: Number(event.currentTarget.value) / 100 })} />
                    </label>
                  </div>
                );
              })()}
              <button className="plan-markup__reset-scale" type="button" onClick={resetCalibration}>Сбросить масштаб</button>
            </div>
          )}
        </div>

        <aside
          className={`plan-markup-summary plan-markup-summary--${markupMode}-mode`}
          aria-labelledby="plan-markup-summary-title"
          aria-live="polite"
        >
          <p className="section-label">Разметка</p>
          <h2 id="plan-markup-summary-title">Текущий план</h2>
          <dl>
            <div><dt>Масштаб</dt><dd>{calibration ? "Определён" : "Не определён"}</dd></div>
            <div><dt>Стен</dt><dd>{markup.walls.length}</dd></div>
            <div><dt>Общая длина</dt><dd>{formatLength(totalWallLength)}</dd></div>
            <div><dt>Помещений</dt><dd>{markup.rooms.length}</dd></div>
            <div><dt>Общая площадь</dt><dd>{formatArea(totalRoomArea)}</dd></div>
            <div><dt>Проёмов</dt><dd>{markup.openings.length}</dd></div>
          </dl>

          {calibration && (
            <div className="plan-markup-summary__calibration">
              <p>Известный отрезок</p>
              <strong>{formatLength(calibration.realLengthMeters)}</strong>
              <small>Коэффициент: {new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 4 }).format(calibration.metersPerPixel)} м / px</small>
            </div>
          )}

          <div className="plan-markup-summary__collections">
          {markup.walls.length > 0 && (
            <section className="plan-markup-summary__section plan-markup-summary__section--walls" aria-labelledby="wall-list-title">
              <h3 id="wall-list-title">Стены</h3>
              <ol className="plan-markup-summary__walls">
                {markup.walls.map((wall, index) => (
                  <li key={wall.id}>
                    <span>{String(index + 1).padStart(2, "0")} — {calibration ? formatLength(getWallLengthMeters(wall, calibration)) : "требуется масштаб"}</span>
                    <button type="button" onClick={() => removeWall(wall.id)} aria-label={`Удалить стену ${index + 1}`}>Удалить</button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {markup.rooms.length > 0 && (
            <section className="plan-markup-summary__section plan-markup-summary__section--rooms" aria-labelledby="room-list-title">
              <h3 id="room-list-title">Помещения</h3>
              <ol className="plan-markup-summary__rooms">
                {markup.rooms.map((room, index) => (
                  <li key={room.id}>
                    <label htmlFor={`room-name-${room.id}`}>{String(index + 1).padStart(2, "0")} — Название</label>
                    <input
                      id={`room-name-${room.id}`}
                      value={room.name}
                      onChange={(event) => updateRoomName(room.id, event.target.value)}
                      onBlur={() => finalizeRoomName(room)}
                      onKeyDown={(event) => handleRoomNameKeyDown(event, room)}
                    />
                    <p>{calibration ? formatArea(getRoomAreaMeters2(room, calibration)) : "Площадь: требуется масштаб"}</p>
                    <p>{calibration ? `Периметр ${formatLength(getRoomPerimeterMeters(room, calibration))}` : "Периметр: требуется масштаб"}</p>
                    <button type="button" onClick={() => removeRoom(room.id)} aria-label={`Удалить помещение ${room.name || index + 1}`}>Удалить</button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {markup.openings.length > 0 && (
            <section className="plan-markup-summary__section plan-markup-summary__section--openings" aria-labelledby="opening-list-title">
              <h3 id="opening-list-title">Проёмы</h3>
              <ol className="plan-markup-summary__openings">
                {markup.openings.map((opening, index) => {
                  const wallNumber = markup.walls.findIndex((wall) => wall.id === opening.wallId) + 1;
                  return (
                    <li key={opening.id} className={selectedOpeningId === opening.id ? "is-selected" : undefined}>
                      <button type="button" onClick={() => setSelectedOpeningId(opening.id)} aria-pressed={selectedOpeningId === opening.id}>
                        <strong>{String(index + 1).padStart(2, "0")} — {opening.type === "door" ? "Дверь" : "Окно"}</strong>
                        <span>Стена {String(wallNumber).padStart(2, "0")}</span>
                        <span>{formatLength(opening.widthMeters)} × {formatLength(opening.heightMeters)}</span>
                        {opening.type === "window" && <span>Подоконник {formatLength(opening.sillHeightMeters)}</span>}
                      </button>
                      <button type="button" onClick={() => removeOpening(opening.id)} aria-label={`Удалить проём ${index + 1}`}>Удалить</button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
          </div>

          <button className="button button--secondary" type="button" onClick={onBack}>Назад к параметрам импорта</button>
          <p className="plan-markup-summary__note">Контуры помещений пока не связаны с графом стен и не преобразуются в PlannerRoom или 3D.</p>
        </aside>
      </div>
    </section>
  );
}
