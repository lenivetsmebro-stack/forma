import { OpeningsEditor } from "@/components/planner/openings-editor";
import type {
  PlannerOpening,
  PlannerOpeningKind,
  PlannerRoom,
} from "@/components/planner/types";
import {
  areRoomOpeningsValid,
  calculateGrossWallArea,
  calculateNetWallArea,
  calculateOpeningsArea,
  calculateRoomCeilingArea,
  calculateRoomFloorArea,
  calculateRoomPerimeter,
  formatArea,
  formatLength,
  getRoomName,
} from "@/components/planner/planner-utils";

type MaterialsRoomProps = {
  room: PlannerRoom;
  index: number;
  onAddOpening: (kind: PlannerOpeningKind) => void;
  onRemoveOpening: (kind: PlannerOpeningKind, openingId: string) => void;
  onUpdateOpening: (
    kind: PlannerOpeningKind,
    openingId: string,
    update: Partial<PlannerOpening>,
  ) => void;
};

export function MaterialsRoom({
  room,
  index,
  onAddOpening,
  onRemoveOpening,
  onUpdateOpening,
}: MaterialsRoomProps) {
  const roomName = getRoomName(room, index);
  const grossWallArea = calculateGrossWallArea(room);
  const openingsArea =
    calculateOpeningsArea(room.doors) + calculateOpeningsArea(room.windows);
  const geometryValid = areRoomOpeningsValid(room);

  return (
    <article className="materials-room" aria-labelledby={`${room.id}-materials-title`}>
      <header className="materials-room__header">
        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3 id={`${room.id}-materials-title`}>{roomName}</h3>
          <p>{formatArea(calculateRoomFloorArea(room))} м²</p>
        </div>
      </header>

      <dl className="materials-room__geometry">
        <div><dt>Пол</dt><dd>{formatArea(calculateRoomFloorArea(room))} м²</dd></div>
        <div><dt>Потолок</dt><dd>{formatArea(calculateRoomCeilingArea(room))} м²</dd></div>
        <div><dt>Периметр</dt><dd>{formatLength(calculateRoomPerimeter(room))} м</dd></div>
        <div><dt>Стены до вычета</dt><dd>{formatArea(grossWallArea)} м²</dd></div>
      </dl>

      <div className="materials-room__openings">
        {(["doors", "windows"] as const).map((kind) => (
          <OpeningsEditor
            key={kind}
            kind={kind}
            openings={room[kind]}
            roomId={room.id}
            roomName={roomName}
            onAdd={() => onAddOpening(kind)}
            onRemove={(openingId) => onRemoveOpening(kind, openingId)}
            onUpdate={(openingId, update) => onUpdateOpening(kind, openingId, update)}
          />
        ))}
      </div>

      {!geometryValid && (
        <p className="materials-room__warning" role="status">
          Площадь окон и дверей превышает площадь стен. Проверьте размеры проёмов.
        </p>
      )}

      <div className="materials-room__net" aria-live="polite">
        <span>Чистая площадь стен</span>
        <strong>{formatArea(calculateNetWallArea(room))} м²</strong>
        <small>Проёмы: {formatArea(openingsArea)} м²</small>
      </div>
    </article>
  );
}
