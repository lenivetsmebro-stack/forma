import { MaterialsRoom } from "@/components/planner/materials-room";
import { MaterialSchedule } from "@/components/planner/material-schedule";
import { MaterialsSummary } from "@/components/planner/materials-summary";
import type {
  PlannerOpening,
  PlannerOpeningKind,
  PlannerRoom,
} from "@/components/planner/types";

type MaterialsStepProps = {
  rooms: PlannerRoom[];
  onBack: () => void;
  onRoomChange: (roomId: string, update: Partial<PlannerRoom>) => void;
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
  onRoomChange,
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
              onRoomChange={(update) => onRoomChange(room.id, update)}
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
            <p>Выбранные материалы и расчёты хранятся в текущей сессии Planner.</p>
          </div>
        </div>
        <MaterialsSummary rooms={rooms} />
      </div>
      <MaterialSchedule rooms={rooms} />
    </section>
  );
}
