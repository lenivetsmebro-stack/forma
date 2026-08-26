import { useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";

import type { PlannerObjectData, PropertyType } from "@/components/planner/types";

type ObjectField = "propertyType" | "totalArea" | "roomCount" | "ceilingHeight" | "floorCount";

type ObjectStepProps = {
  data: PlannerObjectData;
  onChange: (update: Partial<PlannerObjectData>) => void;
  onContinue: () => void;
};

function readNumber(event: ChangeEvent<HTMLInputElement>) {
  return event.target.value === "" ? null : event.target.valueAsNumber;
}

function displayValue(value: number | null, unit: string) {
  return value === null || Number.isNaN(value)
    ? "—"
    : [value, unit].filter(Boolean).join(" ");
}

export function ObjectStep({ data, onChange, onContinue }: ObjectStepProps) {
  const [touched, setTouched] = useState<Partial<Record<ObjectField, boolean>>>({});
  const areaValid = data.totalArea !== null && Number.isFinite(data.totalArea) && data.totalArea > 0;
  const roomsValid = data.roomCount !== null && Number.isInteger(data.roomCount) && data.roomCount >= 1;
  const ceilingValid = data.ceilingHeight !== null && Number.isFinite(data.ceilingHeight) && data.ceilingHeight > 0;
  const floorsValid = data.propertyType !== "house" || (data.floorCount !== null && Number.isInteger(data.floorCount) && data.floorCount >= 1);
  const isValid = data.propertyType !== null && areaValid && roomsValid && ceilingValid && floorsValid;

  function touch(field: ObjectField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isValid) onContinue();
  }

  function selectPropertyType(propertyType: PropertyType) {
    touch("propertyType");
    onChange({ propertyType, floorCount: propertyType === "apartment" ? null : data.floorCount });
  }

  function handlePropertyTypeBlur(event: FocusEvent<HTMLFieldSetElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) touch("propertyType");
  }

  const showAreaError = Boolean(touched.totalArea && !areaValid);
  const showRoomsError = Boolean(touched.roomCount && !roomsValid);
  const showCeilingError = Boolean(touched.ceilingHeight && !ceilingValid);
  const showFloorsError = Boolean(touched.floorCount && !floorsValid);

  return (
    <div className="object-step">
      <form className="object-form" onSubmit={handleSubmit} noValidate>
        <div className="object-form__heading">
          <span aria-hidden="true">01</span>
          <div><p className="section-label">Объект</p><h2>Основные параметры</h2></div>
        </div>

        <fieldset
          className="property-type"
          onBlur={handlePropertyTypeBlur}
          aria-invalid={Boolean(touched.propertyType && data.propertyType === null)}
          aria-describedby={
            touched.propertyType && data.propertyType === null
              ? "property-type-error"
              : undefined
          }
        >
          <legend>Тип объекта</legend>
          <div className="property-type__options">
            {(["apartment", "house"] as const).map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="propertyType"
                  value={type}
                  checked={data.propertyType === type}
                  onChange={() => selectPropertyType(type)}
                  required
                />
                <span>{type === "apartment" ? "Квартира" : "Дом"}</span>
              </label>
            ))}
          </div>
          {touched.propertyType && data.propertyType === null && (
            <p className="field-error" id="property-type-error">Выберите тип объекта.</p>
          )}
        </fieldset>

        <div className="object-form__fields">
          <div className="field">
            <label htmlFor="total-area">Общая площадь</label>
            <div className="field__control">
              <input id="total-area" name="totalArea" type="number" min="0.1" step="0.1" inputMode="decimal" value={data.totalArea ?? ""} onChange={(event) => onChange({ totalArea: readNumber(event) })} onBlur={() => touch("totalArea")} aria-invalid={showAreaError} aria-describedby={showAreaError ? "total-area-error" : undefined} required />
              <span>м²</span>
            </div>
            {showAreaError && <p className="field-error" id="total-area-error">Укажите площадь больше нуля.</p>}
          </div>

          <div className="field">
            <label htmlFor="room-count">Количество помещений</label>
            <div className="field__control">
              <input id="room-count" name="roomCount" type="number" min="1" step="1" inputMode="numeric" value={data.roomCount ?? ""} onChange={(event) => onChange({ roomCount: readNumber(event) })} onBlur={() => touch("roomCount")} aria-invalid={showRoomsError} aria-describedby={showRoomsError ? "room-count-error" : undefined} required />
            </div>
            {showRoomsError && <p className="field-error" id="room-count-error">Укажите целое число от одного.</p>}
          </div>

          <div className="field">
            <label htmlFor="ceiling-height">Высота потолков</label>
            <div className="field__control">
              <input id="ceiling-height" name="ceilingHeight" type="number" min="0.1" step="0.1" inputMode="decimal" placeholder="2.7" value={data.ceilingHeight ?? ""} onChange={(event) => onChange({ ceilingHeight: readNumber(event) })} onBlur={() => touch("ceilingHeight")} aria-invalid={showCeilingError} aria-describedby={showCeilingError ? "ceiling-height-error" : undefined} required />
              <span>м</span>
            </div>
            {showCeilingError && <p className="field-error" id="ceiling-height-error">Укажите высоту больше нуля.</p>}
          </div>

          {data.propertyType === "house" && (
            <div className="field">
              <label htmlFor="floor-count">Количество этажей</label>
              <div className="field__control">
                <input id="floor-count" name="floorCount" type="number" min="1" step="1" inputMode="numeric" value={data.floorCount ?? ""} onChange={(event) => onChange({ floorCount: readNumber(event) })} onBlur={() => touch("floorCount")} aria-invalid={showFloorsError} aria-describedby={showFloorsError ? "floor-count-error" : undefined} required />
              </div>
              {showFloorsError && <p className="field-error" id="floor-count-error">Укажите целое число от одного.</p>}
            </div>
          )}
        </div>

        <div className="object-form__action">
          <button className="button button--primary" type="submit" disabled={!isValid}>Продолжить к помещениям</button>
          <p>{isValid ? "Данные готовы для настройки помещений." : "Заполните обязательные поля, чтобы перейти дальше."}</p>
        </div>
      </form>

      <aside className="object-summary" aria-labelledby="summary-title" aria-live="polite">
        <p className="section-label">Live summary</p>
        <h2 id="summary-title">Ваш объект</h2>
        <dl>
          <div><dt>Тип</dt><dd>{data.propertyType === "apartment" ? "Квартира" : data.propertyType === "house" ? "Дом" : "—"}</dd></div>
          <div><dt>Площадь</dt><dd>{displayValue(data.totalArea, "м²")}</dd></div>
          <div><dt>Помещений</dt><dd>{displayValue(data.roomCount, "")}</dd></div>
          <div><dt>Высота потолков</dt><dd>{displayValue(data.ceilingHeight, "м")}</dd></div>
          {data.propertyType === "house" && <div><dt>Этажей</dt><dd>{displayValue(data.floorCount, "")}</dd></div>}
        </dl>
        <p className="object-summary__note">Расчёт стоимости и материалов появится на следующих этапах.</p>
      </aside>
    </div>
  );
}
