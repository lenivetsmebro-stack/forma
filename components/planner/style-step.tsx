"use client";

import { useState } from "react";

import { getEffectiveStyleForRoom, isDesignStepComplete } from "@/components/planner/design-utils";
import { styleCatalog } from "@/components/planner/style-catalog";
import { StyleCard } from "@/components/planner/style-card";
import { StyleSummary } from "@/components/planner/style-summary";
import type { DesignMode, PlannerDesignData, PlannerRoom } from "@/components/planner/types";
import { getRoomName } from "@/components/planner/planner-utils";

type StyleStepProps = {
  rooms: PlannerRoom[];
  design: PlannerDesignData;
  onChange: (update: Partial<PlannerDesignData>) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function StyleStep({ rooms, design, onChange, onBack, onContinue }: StyleStepProps) {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0]?.id ?? "");
  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0];
  const selectedStyleId = design.mode === "global"
    ? design.globalStyleId
    : activeRoom
      ? design.roomStyleSelections[activeRoom.id] ?? null
      : null;
  const selectedStyle = activeRoom
    ? getEffectiveStyleForRoom(design, activeRoom.id)
    : null;
  const complete = isDesignStepComplete(design, rooms);

  function selectStyle(styleId: string) {
    if (design.mode === "global") {
      onChange({ globalStyleId: styleId });
      return;
    }
    if (!activeRoom) return;
    onChange({
      roomStyleSelections: {
        ...design.roomStyleSelections,
        [activeRoom.id]: styleId,
      },
    });
  }

  return (
    <section className="style-step" aria-labelledby="style-step-title">
      <header className="style-step__header">
        <span aria-hidden="true">04</span>
        <div>
          <p className="section-label">Стиль</p>
          <h2 id="style-step-title">Определите направление интерьера</h2>
          <p>Выберите единый характер объекта или настройте отдельное направление для каждой комнаты.</p>
        </div>
      </header>

      <fieldset className="design-mode">
        <legend>Режим выбора стиля</legend>
        <div>
          {([
            ["global", "Единый стиль", "Одно направление для всего объекта"],
            ["per-room", "Индивидуально", "Отдельный стиль для каждой комнаты"],
          ] as const).map(([mode, label, description]) => (
            <label key={mode}>
              <input
                type="radio"
                name="design-mode"
                value={mode}
                checked={design.mode === mode}
                onChange={() => onChange({ mode: mode as DesignMode })}
              />
              <span><strong>{label}</strong><small>{description}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="style-step__layout">
        <div className="style-step__main">
          {design.mode === "per-room" && (
            <section className="style-rooms" aria-labelledby="style-rooms-title">
              <p className="section-label" id="style-rooms-title">Выберите помещение</p>
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
                    <small>{design.roomStyleSelections[room.id] ? "Стиль выбран" : "Не выбран"}</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          <fieldset className="style-catalog">
            <legend>{design.mode === "global" ? "Стиль объекта" : `Стиль: ${activeRoom ? getRoomName(activeRoom, rooms.indexOf(activeRoom)) : "помещение"}`}</legend>
            <div>
              {styleCatalog.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  name={design.mode === "global" ? "global-style" : `room-style-${activeRoom?.id}`}
                  selected={selectedStyleId === style.id}
                  onSelect={() => selectStyle(style.id)}
                />
              ))}
            </div>
          </fieldset>

          {selectedStyle && (
            <section className="selected-direction" aria-labelledby="selected-direction-title">
              <p className="section-label">Выбранное направление</p>
              <h3 id="selected-direction-title">{selectedStyle.name}</h3>
              <div className="selected-direction__palette">
                {selectedStyle.palette.map((color) => (
                  <span key={color.hex}><i style={{ backgroundColor: color.hex }} />{color.name}</span>
                ))}
              </div>
              <dl>
                <div><dt>Материалы</dt><dd>{selectedStyle.materials.join(" · ")}</dd></div>
                <div><dt>Настроение</dt><dd>{selectedStyle.mood.join(" · ")}</dd></div>
                <div><dt>Комнаты</dt><dd>{design.mode === "global" ? rooms.length : 1}</dd></div>
              </dl>
            </section>
          )}

          <div className="style-step__actions">
            <button className="button button--secondary" type="button" onClick={onBack}>Назад к материалам</button>
            <button className="button button--primary" type="button" disabled={!complete} onClick={onContinue}>Продолжить к 3D</button>
            <p className={complete ? "is-ready" : undefined}>{complete ? "Дизайн-направление готово" : "Завершите выбор стиля"}</p>
            <small>Следующий этап — 3D-визуализация пространства.</small>
          </div>
        </div>
        <StyleSummary rooms={rooms} design={design} />
      </div>
    </section>
  );
}
