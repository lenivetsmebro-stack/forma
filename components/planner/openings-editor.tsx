import type {
  PlannerOpening,
  PlannerOpeningKind,
} from "@/components/planner/types";
import {
  calculateOpeningArea,
  formatArea,
  parsePositiveNumber,
} from "@/components/planner/planner-utils";

type OpeningsEditorProps = {
  kind: PlannerOpeningKind;
  openings: PlannerOpening[];
  roomId: string;
  roomName: string;
  onAdd: () => void;
  onRemove: (openingId: string) => void;
  onUpdate: (openingId: string, update: Partial<PlannerOpening>) => void;
};

export function OpeningsEditor({
  kind,
  openings,
  roomId,
  roomName,
  onAdd,
  onRemove,
  onUpdate,
}: OpeningsEditorProps) {
  const singular = kind === "doors" ? "двери" : "окна";
  const singularAccusative = kind === "doors" ? "дверь" : "окно";
  const title = kind === "doors" ? "Двери" : "Окна";
  const addLabel = kind === "doors" ? "Добавить дверь" : "Добавить окно";
  const placeholders = kind === "doors"
    ? { width: "0.8", height: "2.0" }
    : { width: "1.5", height: "1.4" };

  return (
    <section className="openings-editor" aria-labelledby={`${roomId}-${kind}-title`}>
      <div className="openings-editor__heading">
        <h4 id={`${roomId}-${kind}-title`}>{title}</h4>
        <span>{openings.length}</span>
      </div>

      {openings.length === 0 ? (
        <p className="openings-editor__empty">Проёмы не добавлены.</p>
      ) : (
        <ol>
          {openings.map((opening, index) => {
            const widthValid = parsePositiveNumber(opening.width) !== null;
            const heightValid = parsePositiveNumber(opening.height) !== null;
            const errorId = `${opening.id}-error`;
            return (
              <li key={opening.id}>
                <div className="opening-row__fields">
                  <label>
                    <span>Ширина {singular} {index + 1}</span>
                    <div className="opening-row__control">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        placeholder={placeholders.width}
                        value={opening.width}
                        onChange={(event) => onUpdate(opening.id, { width: event.target.value })}
                        aria-invalid={!widthValid}
                        aria-describedby={!widthValid ? errorId : undefined}
                        required
                      />
                      <span>м</span>
                    </div>
                  </label>
                  <label>
                    <span>Высота {singular} {index + 1}</span>
                    <div className="opening-row__control">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        placeholder={placeholders.height}
                        value={opening.height}
                        onChange={(event) => onUpdate(opening.id, { height: event.target.value })}
                        aria-invalid={!heightValid}
                        aria-describedby={!heightValid ? errorId : undefined}
                        required
                      />
                      <span>м</span>
                    </div>
                  </label>
                </div>
                <div className="opening-row__result">
                  <span>Площадь</span>
                  <strong>{formatArea(calculateOpeningArea(opening))} м²</strong>
                </div>
                {(!widthValid || !heightValid) && (
                  <p className="field-error" id={errorId}>
                    Заполните ширину и высоту значениями больше нуля.
                  </p>
                )}
                <button
                  className="opening-row__remove"
                  type="button"
                  onClick={() => onRemove(opening.id)}
                  aria-label={`Удалить ${singularAccusative} ${index + 1} из комнаты ${roomName}`}
                >
                  Удалить
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <button className="opening-row__add" type="button" onClick={onAdd}>
        <span aria-hidden="true">+</span> {addLabel}
      </button>
    </section>
  );
}
