import { MaterialsRoom } from "@/components/planner/materials-room";
import { MaterialsSummary } from "@/components/planner/materials-summary";
import type {
  PlannerOpening,
  PlannerOpeningKind,
  PlannerRoom,
} from "@/components/planner/types";

type MaterialsStepProps = {
  rooms: PlannerRoom[];
  onBack: () => void;
  onAddOpening: (roomId: string, kind: PlannerOpeningKind) => void;
  onRemoveOpening: (
    roomId: string,
    kind: PlannerOpeningKind,
    openingId: string,
  ) => void;
  onUpdateOpening: (
    roomId: string,
    kind: PlannerOpeningKind,
    openingId: string,
    update: Partial<PlannerOpening>,
  ) => void;
};

export function MaterialsStep({
  rooms,
  onBack,
  onAddOpening,
  onRemoveOpening,
  onUpdateOpening,
}: MaterialsStepProps) {
  return (
    <section className="materials-step" aria-labelledby="materials-step-title">
      <header className="materials-step__header">
        <span aria-hidden="true">03</span>
        <div>
          <p className="section-label">Материалы</p>
          <h2 id="materials-step-title">Уточните геометрию поверхностей</h2>
          <p>
            Эти данные будут использоваться для расчёта отделочных материалов.
          </p>
        </div>
      </header>

      <div className="materials-step__layout">
        <div className="materials-list">
          {rooms.map((room, index) => (
            <MaterialsRoom
              key={room.id}
              room={room}
              index={index}
              onAddOpening={(kind) => onAddOpening(room.id, kind)}
              onRemoveOpening={(kind, openingId) =>
                onRemoveOpening(room.id, kind, openingId)
              }
              onUpdateOpening={(kind, openingId, update) =>
                onUpdateOpening(room.id, kind, openingId, update)
              }
            />
          ))}
          <div className="materials-step__actions">
            <button className="button button--secondary" type="button" onClick={onBack}>
              Назад к помещениям
            </button>
            <p>Каталог материалов будет добавлен на следующем этапе.</p>
          </div>
        </div>
        <MaterialsSummary rooms={rooms} />
      </div>
    </section>
  );
}
