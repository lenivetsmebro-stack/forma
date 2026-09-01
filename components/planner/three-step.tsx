"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { PlannerDesignData, PlannerRoom } from "@/components/planner/types";
import {
  formatRoom3DDimension,
  getRoom3DModel,
} from "@/components/planner/room-3d-utils";
import type { Room3DCameraPreset } from "@/components/planner/room-3d-utils";
import { getRoomName } from "@/components/planner/planner-utils";

const Room3DViewport = dynamic(
  () => import("@/components/planner/room-3d-viewport").then((module) => module.Room3DViewport),
  {
    ssr: false,
    loading: () => <div className="room-3d-viewport__loading" role="status">Загружаем 3D-модуль…</div>,
  },
);

type ThreeStepProps = {
  rooms: PlannerRoom[];
  design: PlannerDesignData;
  onBack: () => void;
};

const cameraPresets: Array<{ id: Room3DCameraPreset; label: string }> = [
  { id: "perspective", label: "Перспектива" },
  { id: "top", label: "Сверху" },
  { id: "cornerA", label: "Угол 1" },
  { id: "cornerB", label: "Угол 2" },
];

export function ThreeStep({ rooms, design, onBack }: ThreeStepProps) {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0]?.id ?? "");
  const [cameraPreset, setCameraPreset] = useState<Room3DCameraPreset>("perspective");
  const activeRoomIndex = Math.max(0, rooms.findIndex((room) => room.id === activeRoomId));
  const activeRoom = rooms[activeRoomIndex];
  const model = activeRoom ? getRoom3DModel(activeRoom, activeRoomIndex, design) : null;
  const cameraLabel = cameraPresets.find((preset) => preset.id === cameraPreset)?.label ?? "Перспектива";

  return (
    <section className="three-step" aria-labelledby="three-step-title">
      <header className="three-step__header">
        <span aria-hidden="true">05</span>
        <div>
          <p className="section-label">3D preview</p>
          <h2 id="three-step-title">Базовая геометрия пространства</h2>
          <p>Первый пространственный preview строится напрямую из размеров комнаты Planner.</p>
        </div>
      </header>

      <section className="three-room-selector" aria-labelledby="three-room-selector-title">
        <p className="section-label" id="three-room-selector-title">Помещение</p>
        <div>
          {rooms.map((room, index) => (
            <button
              type="button"
              key={room.id}
              className={activeRoom?.id === room.id ? "is-active" : undefined}
              aria-pressed={activeRoom?.id === room.id}
              onClick={() => setActiveRoomId(room.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{getRoomName(room, index)}</strong>
              <small>{activeRoom?.id === room.id ? "Активная комната" : "Открыть preview"}</small>
            </button>
          ))}
        </div>
      </section>

      {model ? (
        <div className="three-step__layout">
          <div className="three-step__preview">
            <div className="three-step__room-heading">
              <p className="section-label">Активная комната</p>
              <h3>{model.roomName}</h3>
              <p>{formatRoom3DDimension(model.width)} м × {formatRoom3DDimension(model.length)} м</p>
            </div>
            <Room3DViewport model={model} preset={cameraPreset} />
            <fieldset className="three-camera-controls">
              <legend>Ракурс</legend>
              <div>
                {cameraPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    className={cameraPreset === preset.id ? "is-active" : undefined}
                    aria-pressed={cameraPreset === preset.id}
                    onClick={() => setCameraPreset(preset.id)}
                  >
                    {preset.label}
                    {cameraPreset === preset.id && <span className="sr-only"> — выбран</span>}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className="three-step__summary" aria-labelledby="three-summary-title">
            <p className="section-label">Пространство</p>
            <h3 id="three-summary-title">{model.roomName}</h3>
            <dl>
              <div><dt>Ширина</dt><dd>{formatRoom3DDimension(model.width)} м</dd></div>
              <div><dt>Длина</dt><dd>{formatRoom3DDimension(model.length)} м</dd></div>
              <div><dt>Высота</dt><dd>{formatRoom3DDimension(model.height)} м</dd></div>
              <div><dt>Стиль</dt><dd>{model.designSpecification.styleName}</dd></div>
              <div><dt>Ракурс</dt><dd>{cameraLabel}</dd></div>
              <div><dt>Дверей</dt><dd>{model.doors.length}</dd></div>
              <div><dt>Окон</dt><dd>{model.windows.length}</dd></div>
              <div><dt>Проёмов</dt><dd>{model.doors.length + model.windows.length}</dd></div>
            </dl>
            <p>Положение проёмов показано по временной детерминированной preview-схеме.</p>
          </aside>
        </div>
      ) : (
        <div className="three-step__invalid" role="status">
          Невозможно построить 3D preview. Проверьте размеры комнаты и выбранное дизайн-направление.
        </div>
      )}

      <div className="three-step__actions">
        <button className="button button--secondary" type="button" onClick={onBack}>Назад к стилю</button>
        <button className="button button--primary" type="button" disabled>Продолжить к расчёту</button>
        <p>Этап 06 будет добавлен позже.</p>
      </div>
    </section>
  );
}
