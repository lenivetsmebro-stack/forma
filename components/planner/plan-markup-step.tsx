"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

import type {
  ImportedPlanMarkup,
  ImportedRoomPolygon,
  ImportedWall,
  NormalizedPoint2D,
} from "@/components/planner/imported-plan-types";
import {
  arePointsNear,
  createScaleCalibration,
  getContainedImageRect,
  getNormalizedPoint,
  getPolygonCentroid,
  getRoomAreaMeters2,
  getRoomPerimeterMeters,
  getTotalRoomAreaMeters2,
  getTotalWallLengthMeters,
  getWallLengthMeters,
  isSelfIntersectingPolygon,
  isValidRoomPolygon,
  type Rect2D,
  type Size2D,
} from "@/components/planner/plan-markup-utils";

type MarkupMode = "walls" | "rooms";

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
    } else {
      addRoomVertex(point);
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
      markup.walls.length > 0 || markup.rooms.length > 0
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
    onMarkupChange({ ...markup, walls: markup.walls.filter((wall) => wall.id !== wallId) });
  }

  function removeRoom(roomId: string) {
    onMarkupChange({ ...markup, rooms: markup.rooms.filter((room) => room.id !== roomId) });
  }

  return (
    <section className="plan-markup" aria-labelledby="plan-markup-title">
      <header className="plan-markup__header">
        <span aria-hidden="true">05C.3</span>
        <div>
          <p className="section-label">Разметка планировки</p>
          <h2 id="plan-markup-title">Масштаб, стены и помещения</h2>
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
                  : "3. Сформируйте помещения"}
            </p>
            <p>
              {!calibration
                ? "Выберите две точки на отрезке, длина которого вам известна."
                : markupMode === "walls"
                  ? "Последовательно выберите начало и конец каждой стены."
                  : "Отмечайте углы помещения по порядку, затем явно замкните контур."}
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
              <button className="button button--secondary" type="button" disabled={markup.walls.length === 0} onClick={() => onMarkupChange({ ...markup, walls: markup.walls.slice(0, -1) })}>Удалить последнюю стену</button>
              <button className="button button--secondary" type="button" disabled={markup.walls.length === 0} onClick={() => { onMarkupChange({ ...markup, walls: [] }); setDraftWallStart(null); }}>Очистить стены</button>
              <button className="plan-markup__reset-scale" type="button" onClick={resetCalibration}>Сбросить масштаб</button>
            </div>
          ) : (
            <div className="plan-markup__room-controls">
              <p>Точек: <strong>{draftRoomVertices.length}</strong></p>
              <button className="button button--secondary" type="button" disabled={draftRoomVertices.length === 0} onClick={() => setDraftRoomVertices((current) => current.slice(0, -1))}>Отменить последнюю точку</button>
              <button className="button button--secondary" type="button" disabled={draftRoomVertices.length === 0} onClick={() => { setDraftRoomVertices([]); setGeometryMessage(""); }}>Сбросить контур</button>
              <button className="button button--primary" type="button" disabled={draftRoomVertices.length < 3} onClick={closeRoom}>Замкнуть помещение</button>
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
          </dl>

          {calibration && (
            <div className="plan-markup-summary__calibration">
              <p>Известный отрезок</p>
              <strong>{formatLength(calibration.realLengthMeters)}</strong>
              <small>Коэффициент: {new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 4 }).format(calibration.metersPerPixel)} м / px</small>
            </div>
          )}

          {markup.walls.length > 0 && (
            <section className="plan-markup-summary__section" aria-labelledby="wall-list-title">
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
            <section className="plan-markup-summary__section" aria-labelledby="room-list-title">
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

          <button className="button button--secondary" type="button" onClick={onBack}>Назад к параметрам импорта</button>
          <p className="plan-markup-summary__note">Контуры помещений пока не связаны с графом стен и не преобразуются в PlannerRoom или 3D.</p>
        </aside>
      </div>
    </section>
  );
}
