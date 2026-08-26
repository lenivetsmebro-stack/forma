import type { PlannerRoom } from "@/components/planner/types";
import {
  calculateAreaCompletionPercent,
  calculateAreaDifference,
  calculateRoomArea,
  calculateRoomsTotalArea,
  formatArea,
  getAreaDistributionStatus,
  getRoomName,
} from "@/components/planner/planner-utils";

type RoomsSummaryProps = { rooms: PlannerRoom[]; objectArea: number };

export function RoomsSummary({ rooms, objectArea }: RoomsSummaryProps) {
  const totalArea = calculateRoomsTotalArea(rooms);
  const difference = calculateAreaDifference(objectArea, totalArea);
  const completionPercent = calculateAreaCompletionPercent(objectArea, totalArea);
  const status = getAreaDistributionStatus(objectArea, totalArea);
  const statusContent = {
    UNDER: {
      title: `Осталось распределить: ${formatArea(difference)} м²`,
      detail: "Добавьте площадь существующим помещениям или скорректируйте параметры объекта.",
    },
    MATCHED: {
      title: "Площадь распределена",
      detail: "Сумма помещений соответствует площади объекта.",
    },
    OVER: {
      title: `Площадь помещений превышена на ${formatArea(Math.abs(difference))} м²`,
      detail: "Уменьшите размеры помещений или скорректируйте общую площадь объекта.",
    },
  }[status];

  return (
    <aside className="rooms-summary" aria-labelledby="rooms-summary-title" aria-live="polite">
      <p className="section-label">Live summary</p>
      <h2 id="rooms-summary-title">Ваши помещения</h2>
      <p className="rooms-summary__count">{rooms.length} помещений</p>
      <ol>
        {rooms.map((room, index) => (
          <li key={room.id}>
            <span>{getRoomName(room, index)}</span>
            <strong>{formatArea(calculateRoomArea(room))} м²</strong>
          </li>
        ))}
      </ol>
      <div className="rooms-summary__distribution">
        <p>Распределение площади</p>
        <strong>{formatArea(totalArea)} / {formatArea(objectArea)} м²</strong>
        <span>{completionPercent.toFixed(1)}%</span>
      </div>
      <dl>
        <div><dt>Общая площадь помещений</dt><dd>{formatArea(totalArea)} м²</dd></div>
        <div><dt>Площадь объекта</dt><dd>{formatArea(objectArea)} м²</dd></div>
        <div><dt>Распределено</dt><dd>{completionPercent.toFixed(1)}%</dd></div>
        <div><dt>Разница</dt><dd>{formatArea(Math.abs(difference))} м²</dd></div>
      </dl>
      <div className={`rooms-summary__comparison is-${status.toLowerCase()}`}>
        <strong>{statusContent.title}</strong>
        <p>{statusContent.detail}</p>
      </div>
    </aside>
  );
}
