import type { PlannerRoom } from "@/components/planner/types";
import { getMaterialById } from "@/components/planner/material-catalog";
import { aggregateRoomMaterials } from "@/components/planner/material-utils";
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
        {materialTotals.length > 0 ? (
          <ul>
            {materialTotals.map((total) => {
              const material = getMaterialById(total.materialId);
              if (!material) return null;
              return (
                <li key={total.materialId}>
                  <div>
                    <strong>{material.label}</strong>
                    <span>{total.roomCount} {total.roomCount === 1 ? "помещение" : "помещения"}</span>
                  </div>
                  <dl>
                    <div><dt>Базовая площадь</dt><dd>{formatArea(total.baseArea)} м²</dd></div>
                    <div><dt>С учётом запаса</dt><dd>{formatArea(total.requiredArea)} м²</dd></div>
                    {total.packages !== null && total.purchasedArea !== null && (
                      <>
                        <div><dt>Необходимо</dt><dd>{total.packages} уп.</dd></div>
                        <div><dt>Будет куплено</dt><dd>{formatArea(total.purchasedArea)} м²</dd></div>
                      </>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="materials-summary__empty">Выберите отделку в помещениях — расчёт появится здесь автоматически.</p>
        )}
      </section>
      <p>
        Расчёты основаны на прямоугольной геометрии помещений. Позиции проёмов
        на стенах будут уточняться на следующих этапах.
      </p>
    </aside>
  );
}
