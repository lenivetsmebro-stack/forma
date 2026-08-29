"use client";

import dynamic from "next/dynamic";

import type { PlannerDesignData, PlannerRoom } from "@/components/planner/types";
import {
  formatRoom3DDimension,
  getRoom3DModel,
} from "@/components/planner/room-3d-utils";

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

export function ThreeStep({ rooms, design, onBack }: ThreeStepProps) {
  const activeRoom = rooms[0];
  const model = activeRoom ? getRoom3DModel(activeRoom, 0, design) : null;

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

      {model ? (
        <div className="three-step__layout">
          <div className="three-step__preview">
            <div className="three-step__room-heading">
              <p className="section-label">Активная комната</p>
              <h3>{model.roomName}</h3>
              <p>{formatRoom3DDimension(model.width)} м × {formatRoom3DDimension(model.length)} м</p>
            </div>
            <Room3DViewport model={model} />
          </div>

          <aside className="three-step__summary" aria-labelledby="three-summary-title">
            <p className="section-label">Пространство</p>
            <h3 id="three-summary-title">{model.roomName}</h3>
            <dl>
              <div><dt>Ширина</dt><dd>{formatRoom3DDimension(model.width)} м</dd></div>
              <div><dt>Длина</dt><dd>{formatRoom3DDimension(model.length)} м</dd></div>
              <div><dt>Высота</dt><dd>{formatRoom3DDimension(model.height)} м</dd></div>
              <div><dt>Стиль</dt><dd>{model.designSpecification.styleName}</dd></div>
              <div><dt>Дверей</dt><dd>{model.doors.length}</dd></div>
              <div><dt>Окон</dt><dd>{model.windows.length}</dd></div>
            </dl>
            <p>Проёмы переданы в 3D-модель как данные и будут размещены на стенах в следующем подэтапе.</p>
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
