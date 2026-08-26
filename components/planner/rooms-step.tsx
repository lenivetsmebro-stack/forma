import type { PlannerObjectData, PlannerRoom } from "@/components/planner/types";
import {
  calculateRoomsTotalArea,
  isAreaMatched,
  isRoomValid,
} from "@/components/planner/planner-utils";
import { RoomCard } from "@/components/planner/room-card";
import { RoomsSummary } from "@/components/planner/rooms-summary";

type RoomsStepProps = {
  objectData: PlannerObjectData;
  rooms: PlannerRoom[];
  onBack: () => void;
  onContinue: () => void;
  onRoomChange: (roomId: string, update: Partial<PlannerRoom>) => void;
};

export function RoomsStep({
  objectData,
  rooms,
  onBack,
  onContinue,
  onRoomChange,
}: RoomsStepProps) {
  const completedCount = rooms.filter(isRoomValid).length;
  const allRoomsValid = rooms.length > 0 && completedCount === rooms.length;
  const roomCountMatched = rooms.length === objectData.roomCount;
  const roomsTotalArea = calculateRoomsTotalArea(rooms);
  const areaMatched = isAreaMatched(objectData.totalArea ?? 0, roomsTotalArea);
  const plannerReady = allRoomsValid && roomCountMatched && areaMatched;
  const readinessMessage = !allRoomsValid
    ? "Заполните параметры всех помещений"
    : !roomCountMatched
      ? "Синхронизируйте количество помещений с параметрами объекта"
    : !areaMatched
      ? "Согласуйте площадь помещений с площадью объекта"
      : "Данные готовы к этапу материалов";

  return (
    <section className="rooms-step" aria-labelledby="rooms-step-title">
      <header className="rooms-step__header">
        <span aria-hidden="true">02</span>
        <div>
          <p className="section-label">Помещения</p>
          <h2 id="rooms-step-title">Настройте каждое помещение</h2>
          <p>
            Укажите назначение и размеры помещений. Planner рассчитает площадь
            каждой комнаты и общую площадь автоматически.
          </p>
          <dl>
            <div><dt>Помещений</dt><dd>{rooms.length}</dd></div>
            <div><dt>Заполнено</dt><dd>{completedCount} / {rooms.length}</dd></div>
          </dl>
        </div>
      </header>

      <div className="rooms-step__layout">
        <div className="rooms-list">
          {rooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              index={index}
              onChange={(update) => onRoomChange(room.id, update)}
            />
          ))}
          <div className="rooms-step__actions">
            <button className="button button--secondary" type="button" onClick={onBack}>Назад к объекту</button>
            <button
              className="button button--primary"
              type="button"
              onClick={onContinue}
              disabled={!plannerReady}
            >
              Продолжить к материалам
            </button>
            <p className={plannerReady ? "is-ready" : undefined}>{readinessMessage}</p>
            {plannerReady && <small>Геометрия поверхностей готова к настройке.</small>}
          </div>
        </div>
        <RoomsSummary rooms={rooms} objectArea={objectData.totalArea ?? 0} />
      </div>
    </section>
  );
}
