import type { PlannerRoom } from "@/components/planner/types";
import {
  calculateTotalCeilingArea,
  calculateTotalDoorArea,
  calculateTotalFloorArea,
  calculateTotalGrossWallArea,
  calculateTotalNetWallArea,
  calculateTotalWindowArea,
  formatArea,
} from "@/components/planner/planner-utils";

type MaterialsSummaryProps = { rooms: PlannerRoom[] };

export function MaterialsSummary({ rooms }: MaterialsSummaryProps) {
  const values = [
    ["Пол", calculateTotalFloorArea(rooms)],
    ["Потолок", calculateTotalCeilingArea(rooms)],
    ["Стены до вычета", calculateTotalGrossWallArea(rooms)],
    ["Двери", calculateTotalDoorArea(rooms)],
    ["Окна", calculateTotalWindowArea(rooms)],
    ["Стены под отделку", calculateTotalNetWallArea(rooms)],
  ] as const;

  return (
    <aside className="materials-summary" aria-labelledby="materials-summary-title" aria-live="polite">
      <p className="section-label">Live summary</p>
      <h2 id="materials-summary-title">Поверхности</h2>
      <dl>
        {values.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{formatArea(value)} м²</dd></div>
        ))}
        <div><dt>Количество помещений</dt><dd>{rooms.length}</dd></div>
      </dl>
      <p>
        Расчёты основаны на прямоугольной геометрии помещений. Позиции проёмов
        на стенах будут уточняться на следующих этапах.
      </p>
    </aside>
  );
}
