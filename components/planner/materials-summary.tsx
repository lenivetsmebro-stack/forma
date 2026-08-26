import type { PlannerRoom } from "@/components/planner/types";
import {
  aggregateRoomMaterials,
  formatCurrency,
  getMaterialScheduleSummary,
} from "@/components/planner/material-utils";
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
  const materialTotals = aggregateRoomMaterials(rooms);
  const materialSummary = getMaterialScheduleSummary(rooms, materialTotals);
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
      <section className="materials-summary__materials" aria-labelledby="materials-totals-title">
        <p className="section-label">Материалы</p>
        <h3 id="materials-totals-title">По всему объекту</h3>
        {materialTotals.length === 0 && (
          <p className="materials-summary__empty">Выберите отделку в помещениях — расчёт появится здесь автоматически.</p>
        )}
        <dl className="materials-summary__material-counts">
          <div><dt>Выбрано</dt><dd>{materialSummary.selectedCount}</dd></div>
          <div><dt>К закупке</dt><dd>{materialSummary.purchasePositionCount} поз.</dd></div>
          <div><dt>Предварительно</dt><dd>{formatCurrency(materialSummary.totalCost)}</dd></div>
        </dl>
      </section>
      <p>
        Расчёты основаны на прямоугольной геометрии помещений. Позиции проёмов
        на стенах будут уточняться на следующих этапах.
      </p>
    </aside>
  );
}
