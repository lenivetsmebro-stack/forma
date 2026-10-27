"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import {
  AREA_MAX,
  AREA_MIN,
  calculateEstimate,
  CONDITIONS,
  DESIGN_RATE,
  formatRub,
  KINDS,
  PACKAGES,
} from "@/lib/estimate";
import type { Condition, Package, PropertyKind } from "@/lib/estimate";

type OptionGroupProps<T extends string> = {
  legend: string;
  name: string;
  value: T;
  options: Record<T, { label: string; note?: string }>;
  onChange: (value: T) => void;
};

function OptionGroup<T extends string>({ legend, name, value, options, onChange }: OptionGroupProps<T>) {
  return (
    <fieldset className="calc__group">
      <legend>{legend}</legend>
      <div className="calc__options">
        {(Object.keys(options) as T[]).map((key) => (
          <label key={key} className="calc__option">
            <input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)} />
            <span>
              <strong>{options[key].label}</strong>
              {options[key].note && <small>{options[key].note}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CostCalculator() {
  const areaId = useId();
  const [kind, setKind] = useState<PropertyKind>("apartment");
  const [condition, setCondition] = useState<Condition>("new");
  const [pack, setPack] = useState<Package>("capital");
  const [areaInput, setAreaInput] = useState("60");
  const [withDesign, setWithDesign] = useState(true);

  const area = Number(areaInput.replace(",", "."));
  const estimate = useMemo(
    () => calculateEstimate({ kind, condition, pack, area, withDesign }),
    [kind, condition, pack, area, withDesign],
  );
  const areaInvalid = areaInput.trim() !== "" && !estimate;

  return (
    <div className="calc">
      <form className="calc__form" onSubmit={(event) => event.preventDefault()} aria-label="Параметры расчёта">
        <OptionGroup legend="Объект" name="kind" value={kind} options={KINDS} onChange={setKind} />
        <OptionGroup legend="Состояние" name="condition" value={condition} options={CONDITIONS} onChange={setCondition} />

        <div className="calc__group">
          <label className="calc__legend" htmlFor={areaId}>Площадь</label>
          <div className="field__control">
            <input
              id={areaId}
              type="number"
              inputMode="decimal"
              min={AREA_MIN}
              max={AREA_MAX}
              step="1"
              value={areaInput}
              aria-invalid={areaInvalid}
              aria-describedby={areaInvalid ? `${areaId}-error` : undefined}
              onChange={(event) => setAreaInput(event.target.value)}
            />
            <span>м²</span>
          </div>
          {areaInvalid && (
            <p className="field-error" id={`${areaId}-error`}>Укажите площадь от {AREA_MIN} до {AREA_MAX} м².</p>
          )}
        </div>

        <OptionGroup legend="Тип ремонта" name="pack" value={pack} options={PACKAGES} onChange={setPack} />

        <label className="calc__toggle">
          <input type="checkbox" checked={withDesign} onChange={(event) => setWithDesign(event.target.checked)} />
          <span>
            <strong>Добавить дизайн-проект</strong>
            <small>{formatRub(DESIGN_RATE)} за м² — планировка, концепция и рабочие чертежи</small>
          </span>
        </label>
      </form>

      <aside className="calc__result" aria-live="polite" aria-labelledby="calc-result-title">
        <p className="section-label" id="calc-result-title">Предварительная оценка</p>
        {estimate ? (
          <>
            <p className="calc__total">
              {formatRub(estimate.totalMin)}
              <span>—</span>
              {formatRub(estimate.totalMax)}
            </p>
            <dl className="calc__breakdown">
              <div><dt>Работы и черновые материалы</dt><dd>{formatRub(estimate.worksMin)} — {formatRub(estimate.worksMax)}</dd></div>
              <div><dt>Дизайн-проект</dt><dd>{estimate.design > 0 ? formatRub(estimate.design) : "не включён"}</dd></div>
              <div><dt>Срок ремонта</dt><dd>{estimate.monthsMin}–{estimate.monthsMax} мес.</dd></div>
            </dl>
            <p className="calc__note">
              Чистовые материалы, мебель и техника считаются отдельно. Точную смету фиксируем после выезда на объект.
            </p>
            <div className="calc__actions">
              <Link className="button button--primary" href={`/contacts?area=${Math.round(area)}&pack=${pack}`}>
                Получить точную смету
              </Link>
              <Link className="button button--secondary" href="/planner">Детальный расчёт в Planner</Link>
            </div>
          </>
        ) : (
          <p className="calc__empty">Укажите площадь от {AREA_MIN} до {AREA_MAX} м², чтобы увидеть оценку.</p>
        )}
      </aside>
    </div>
  );
}
