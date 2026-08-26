import { useState } from "react";
import type { FocusEvent } from "react";

import type { PlannerRoom, RoomType } from "@/components/planner/types";
import { calculateRoomArea, formatArea, parsePositiveNumber, roomTypeOptions } from "@/components/planner/planner-utils";

type RoomField = "type" | "customName" | "length" | "width" | "height";
type RoomCardProps = { room: PlannerRoom; index: number; onChange: (update: Partial<PlannerRoom>) => void };

export function RoomCard({ room, index, onChange }: RoomCardProps) {
  const [touched, setTouched] = useState<Partial<Record<RoomField, boolean>>>({});
  const touch = (field: RoomField) => setTouched((current) => ({ ...current, [field]: true }));
  const typeError = Boolean(touched.type && room.type === "");
  const customNameError = Boolean(touched.customName && room.type === "other" && !room.customName.trim());
  const lengthError = Boolean(touched.length && parsePositiveNumber(room.length) === null);
  const widthError = Boolean(touched.width && parsePositiveNumber(room.width) === null);
  const heightError = Boolean(touched.height && parsePositiveNumber(room.height) === null);
  const area = calculateRoomArea(room);

  function selectType(type: RoomType) {
    touch("type");
    onChange({ type, customName: type === "other" ? room.customName : "" });
  }

  function handleTypeBlur(event: FocusEvent<HTMLFieldSetElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) touch("type");
  }

  return (
    <article className="room-card" aria-labelledby={`${room.id}-title`}>
      <header className="room-card__header">
        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <h3 id={`${room.id}-title`}>Помещение {index + 1}</h3>
      </header>

      <fieldset className="room-types" onBlur={handleTypeBlur} aria-describedby={typeError ? `${room.id}-type-error` : undefined} aria-invalid={typeError}>
        <legend>Тип помещения</legend>
        <div className="room-types__options">
          {roomTypeOptions.map((option) => (
            <label key={option.value}>
              <input type="radio" name={`${room.id}-type`} value={option.value} checked={room.type === option.value} onChange={() => selectType(option.value)} required />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {typeError && <p className="field-error" id={`${room.id}-type-error`}>Выберите тип помещения.</p>}
      </fieldset>

      {room.type === "other" && (
        <div className="field room-card__custom-name">
          <label htmlFor={`${room.id}-custom-name`}>Название помещения</label>
          <div className="field__control">
            <input id={`${room.id}-custom-name`} type="text" value={room.customName} placeholder="Например, постирочная" onChange={(event) => onChange({ customName: event.target.value })} onBlur={() => touch("customName")} aria-invalid={customNameError} aria-describedby={customNameError ? `${room.id}-custom-error` : undefined} required />
          </div>
          {customNameError && <p className="field-error" id={`${room.id}-custom-error`}>Укажите название помещения.</p>}
        </div>
      )}

      <div className="room-card__dimensions">
        {([
          ["length", "Длина", "Длина должна быть больше нуля."],
          ["width", "Ширина", "Ширина должна быть больше нуля."],
          ["height", "Высота потолков", "Высота должна быть больше нуля."],
        ] as const).map(([field, label, message]) => {
          const error = field === "length" ? lengthError : field === "width" ? widthError : heightError;
          return (
            <div className="field" key={field}>
              <label htmlFor={`${room.id}-${field}`}>{label}</label>
              <div className="field__control">
                <input id={`${room.id}-${field}`} type="number" min="0.01" step="0.01" inputMode="decimal" value={room[field]} onChange={(event) => onChange({ [field]: event.target.value })} onBlur={() => touch(field)} aria-invalid={error} aria-describedby={error ? `${room.id}-${field}-error` : undefined} required />
                <span>м</span>
              </div>
              {error && <p className="field-error" id={`${room.id}-${field}-error`}>{message}</p>}
            </div>
          );
        })}
      </div>

      <div className="room-card__area" aria-live="polite">
        <span>Площадь помещения</span>
        <strong>{formatArea(area)} м²</strong>
      </div>
    </article>
  );
}
