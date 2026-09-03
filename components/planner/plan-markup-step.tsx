"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import type {
  ImportedPlanMarkup,
  ImportedWall,
  NormalizedPoint2D,
} from "@/components/planner/imported-plan-types";
import {
  createScaleCalibration,
  getContainedImageRect,
  getNormalizedDistance,
  getNormalizedPoint,
  getTotalWallLengthMeters,
  getWallLengthMeters,
  type Rect2D,
  type Size2D,
} from "@/components/planner/plan-markup-utils";

type PlanMarkupStepProps = {
  fileName: string;
  previewUrl: string;
  markup: ImportedPlanMarkup;
  realLengthInput: string;
  onRealLengthChange: (value: string) => void;
  onMarkupChange: (markup: ImportedPlanMarkup) => void;
  onBack: () => void;
};

function formatLength(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value)} м`;
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
  const [draftWallStart, setDraftWallStart] = useState<NormalizedPoint2D | null>(null);
  const [wallModeActive, setWallModeActive] = useState(false);

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

  const lengthValue = Number(realLengthInput);
  const canConfirmCalibration =
    markup.calibrationPoints.length === 2 &&
    Number.isFinite(lengthValue) &&
    lengthValue > 0;
  const calibration = markup.calibration;
  const totalWallLength = calibration
    ? getTotalWallLengthMeters(markup.walls, calibration)
    : null;
  const markerRadius = intrinsicSize
    ? Math.min(intrinsicSize.width, intrinsicSize.height) * 0.012
    : 0;

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

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const point = getPointFromPointer(event);
    if (!point) return;

    if (!markup.calibration) {
      if (markup.calibrationPoints.length >= 2) return;
      onMarkupChange({
        ...markup,
        calibrationPoints: [...markup.calibrationPoints, point],
      });
      return;
    }

    if (!wallModeActive) return;
    if (!draftWallStart) {
      setDraftWallStart(point);
      return;
    }

    const distance = getNormalizedDistance(draftWallStart, point);
    if (distance === null || distance <= 0) return;
    const wall: ImportedWall = {
      id: `${markup.fileSessionId}-wall-${Math.max(0, ...markup.walls.map((item) => Number(item.id.split("-").pop()) || 0)) + 1}`,
      start: draftWallStart,
      end: point,
    };
    onMarkupChange({ ...markup, walls: [...markup.walls, wall] });
    setDraftWallStart(null);
  }

  function confirmCalibration() {
    const [pointA, pointB] = markup.calibrationPoints;
    if (!pointA || !pointB) return;
    const calibration = createScaleCalibration(pointA, pointB, lengthValue);
    if (!calibration) return;
    onMarkupChange({ ...markup, calibration });
    setWallModeActive(true);
  }

  function resetCalibration() {
    onMarkupChange({ ...markup, calibrationPoints: [], calibration: null });
    setDraftWallStart(null);
    setWallModeActive(false);
    onRealLengthChange("");
  }

  function removeWall(wallId: string) {
    onMarkupChange({
      ...markup,
      walls: markup.walls.filter((wall) => wall.id !== wallId),
    });
  }

  function removeLastWall() {
    onMarkupChange({ ...markup, walls: markup.walls.slice(0, -1) });
  }

  function clearWalls() {
    onMarkupChange({ ...markup, walls: [] });
    setDraftWallStart(null);
  }

  return (
    <section className="plan-markup" aria-labelledby="plan-markup-title">
      <header className="plan-markup__header">
        <span aria-hidden="true">05C.2</span>
        <div>
          <p className="section-label">Разметка планировки</p>
          <h2 id="plan-markup-title">Масштаб и стены</h2>
          <p>
            Сначала отметьте известный отрезок, затем проведите стены поверх
            изображения. Координаты сохраняются независимо от размера экрана.
          </p>
        </div>
      </header>

      <div className="plan-markup__layout">
        <div className="plan-markup__main">
          <div className="plan-markup__instructions">
            <p className="section-label">
              {markup.calibration ? "2. Разметьте стены" : "1. Определите масштаб"}
            </p>
            <p>
              {markup.calibration
                ? "Включите добавление стены и последовательно выберите её начало и конец."
                : "Выберите две точки на отрезке, длина которого вам известна."}
            </p>
          </div>

          <div className="plan-markup__workspace" ref={workspaceRef}>
            <Image
              src={previewUrl}
              alt={`Планировка для разметки: ${fileName}`}
              fill
              sizes="(max-width: 1023px) 100vw, 68vw"
              unoptimized
              onLoad={(event) =>
                setIntrinsicSize({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
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
                viewBox={`0 0 ${intrinsicSize?.width ?? 1} ${intrinsicSize?.height ?? 1}`}
                role="group"
                aria-label={markup.calibration ? "Область разметки стен" : "Область выбора точек масштаба"}
                onPointerDown={handlePointerDown}
              >
                {markup.walls.map((wall) => (
                  <g key={wall.id} className="plan-markup__wall">
                    <line x1={wall.start.x * (intrinsicSize?.width ?? 1)} y1={wall.start.y * (intrinsicSize?.height ?? 1)} x2={wall.end.x * (intrinsicSize?.width ?? 1)} y2={wall.end.y * (intrinsicSize?.height ?? 1)} />
                    <circle cx={wall.start.x * (intrinsicSize?.width ?? 1)} cy={wall.start.y * (intrinsicSize?.height ?? 1)} r={markerRadius * 0.65} />
                    <circle cx={wall.end.x * (intrinsicSize?.width ?? 1)} cy={wall.end.y * (intrinsicSize?.height ?? 1)} r={markerRadius * 0.65} />
                  </g>
                ))}
                {markup.calibrationPoints.length === 2 && (
                  <line
                    className="plan-markup__calibration-line"
                    x1={(markup.calibrationPoints[0]?.x ?? 0) * (intrinsicSize?.width ?? 1)}
                    y1={(markup.calibrationPoints[0]?.y ?? 0) * (intrinsicSize?.height ?? 1)}
                    x2={(markup.calibrationPoints[1]?.x ?? 0) * (intrinsicSize?.width ?? 1)}
                    y2={(markup.calibrationPoints[1]?.y ?? 0) * (intrinsicSize?.height ?? 1)}
                  />
                )}
                {markup.calibrationPoints.map((point, index) => (
                  <g key={`calibration-${index}`} className="plan-markup__calibration-point">
                    <circle cx={point.x * (intrinsicSize?.width ?? 1)} cy={point.y * (intrinsicSize?.height ?? 1)} r={markerRadius} />
                    <text x={point.x * (intrinsicSize?.width ?? 1)} y={point.y * (intrinsicSize?.height ?? 1)} dx={markerRadius * 1.4} dy={-markerRadius * 1.4}>
                      {index === 0 ? "A" : "B"}
                    </text>
                  </g>
                ))}
                {draftWallStart && (
                  <g className="plan-markup__draft-point">
                    <circle cx={draftWallStart.x * (intrinsicSize?.width ?? 1)} cy={draftWallStart.y * (intrinsicSize?.height ?? 1)} r={markerRadius} />
                    <text x={draftWallStart.x * (intrinsicSize?.width ?? 1)} y={draftWallStart.y * (intrinsicSize?.height ?? 1)} dx={markerRadius * 1.4} dy={-markerRadius * 1.4}>A</text>
                  </g>
                )}
              </svg>
            )}
          </div>

          {!markup.calibration ? (
            <div className="plan-markup__calibration-controls">
              <div className="field">
                <label htmlFor="calibration-length">Фактическая длина</label>
                <div className="field__control">
                  <input
                    id="calibration-length"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="3.05"
                    value={realLengthInput}
                    onChange={(event) => onRealLengthChange(event.target.value)}
                  />
                  <span>м</span>
                </div>
              </div>
              <button className="button button--primary" type="button" disabled={!canConfirmCalibration} onClick={confirmCalibration}>
                Подтвердить масштаб
              </button>
              <button className="button button--secondary" type="button" disabled={markup.calibrationPoints.length === 0} onClick={resetCalibration}>
                Сбросить точки
              </button>
            </div>
          ) : (
            <div className="plan-markup__wall-controls">
              <button className="button button--primary" type="button" aria-pressed={wallModeActive} onClick={() => { setWallModeActive(true); setDraftWallStart(null); }}>
                {wallModeActive ? "Добавление стены включено" : "Добавить стену"}
              </button>
              <button className="button button--secondary" type="button" disabled={markup.walls.length === 0} onClick={removeLastWall}>
                Удалить последнюю стену
              </button>
              <button className="button button--secondary" type="button" disabled={markup.walls.length === 0} onClick={clearWalls}>
                Очистить стены
              </button>
              <button className="plan-markup__reset-scale" type="button" onClick={resetCalibration}>
                Сбросить масштаб
              </button>
            </div>
          )}
        </div>

        <aside className="plan-markup-summary" aria-labelledby="plan-markup-summary-title" aria-live="polite">
          <p className="section-label">Разметка</p>
          <h2 id="plan-markup-summary-title">Текущий план</h2>
          <dl>
            <div><dt>Масштаб</dt><dd>{markup.calibration ? "Определён" : "Не определён"}</dd></div>
            <div><dt>Стен</dt><dd>{markup.walls.length}</dd></div>
            <div><dt>Общая длина</dt><dd>{formatLength(totalWallLength)}</dd></div>
          </dl>

          {calibration && (
            <div className="plan-markup-summary__calibration">
              <p>Известный отрезок</p>
              <strong>{formatLength(calibration.realLengthMeters)}</strong>
              <small>
                Коэффициент: {new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(calibration.metersPerNormalizedUnit)} м / ед.
              </small>
            </div>
          )}

          {markup.walls.length > 0 && calibration && (
            <ol className="plan-markup-summary__walls">
              {markup.walls.map((wall, index) => (
                <li key={wall.id}>
                    <span>{String(index + 1).padStart(2, "0")} — {formatLength(getWallLengthMeters(wall, calibration))}</span>
                  <button type="button" onClick={() => removeWall(wall.id)} aria-label={`Удалить стену ${index + 1}`}>
                    Удалить
                  </button>
                </li>
              ))}
            </ol>
          )}

          <button className="button button--secondary" type="button" onClick={onBack}>
            Назад к параметрам импорта
          </button>
          <p className="plan-markup-summary__note">
            Помещения, двери, окна и 3D будут сформированы на следующих этапах.
          </p>
        </aside>
      </div>
    </section>
  );
}
