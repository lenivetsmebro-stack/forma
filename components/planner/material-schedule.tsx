import {
  getMaterialById,
  materialSurfaceLabels,
} from "@/components/planner/material-catalog";
import {
  aggregateRoomMaterials,
  formatCurrency,
  getMaterialScheduleSummary,
  getMaterialWasteLabel,
  getPriceUnitLabel,
} from "@/components/planner/material-utils";
import type { MaterialSurface, PlannerRoom } from "@/components/planner/types";
import { formatArea } from "@/components/planner/planner-utils";

type MaterialScheduleProps = { rooms: PlannerRoom[] };

const surfaces: MaterialSurface[] = ["floor", "walls", "ceiling"];

export function MaterialSchedule({ rooms }: MaterialScheduleProps) {
  const aggregates = aggregateRoomMaterials(rooms);
  const summary = getMaterialScheduleSummary(rooms, aggregates);

  return (
    <section className="material-schedule" aria-labelledby="material-schedule-title" aria-live="polite">
      <header className="material-schedule__header">
        <p className="section-label">Ведомость материалов</p>
        <h2 id="material-schedule-title">Предварительный расчёт материалов для всего объекта</h2>
      </header>

      {aggregates.length > 0 ? (
        <div className="material-schedule__groups">
          {surfaces.map((surface) => {
            const items = aggregates.filter((item) => item.surface === surface);
            if (items.length === 0) return null;
            return (
              <section className="material-schedule__group" key={surface} aria-labelledby={`schedule-${surface}`}>
                <h3 id={`schedule-${surface}`}>{materialSurfaceLabels[surface]}</h3>
                <div className="material-schedule__items">
                  {items.map((item) => {
                    const material = getMaterialById(item.materialId);
                    if (!material) return null;
                    return (
                      <article className="material-schedule__item" key={item.materialId}>
                        <header>
                          <div>
                            <h4>{material.label}</h4>
                            <p>{item.rooms.map((room) => room.roomName).join(" · ")}</p>
                          </div>
                          <span>Запас: {getMaterialWasteLabel(item)}</span>
                        </header>

                        <div className="material-schedule__rooms">
                          {item.rooms.map((room) => (
                            <div key={room.roomId}>
                              <strong>{room.roomName}</strong>
                              <span>{formatArea(room.baseArea)} м²</span>
                              <span>→ {formatArea(room.requiredArea)} м²</span>
                              {room.packages !== null && <span>→ {room.packages} уп.</span>}
                            </div>
                          ))}
                        </div>

                        <dl className="material-schedule__totals">
                          <div><dt>Базовая площадь</dt><dd>{formatArea(item.baseArea)} м²</dd></div>
                          <div><dt>С учётом запаса</dt><dd>{formatArea(item.requiredArea)} м²</dd></div>
                          {item.packages !== null && item.purchasedArea !== null && (
                            <>
                              <div><dt>Упаковок</dt><dd>{item.packages}</dd></div>
                              <div><dt>К покупке</dt><dd>{formatArea(item.purchasedArea)} м²</dd></div>
                            </>
                          )}
                          {material.pricing && (
                            <div>
                              <dt>Цена за {getPriceUnitLabel(material)}</dt>
                              <dd>{formatCurrency(material.pricing.price)}</dd>
                            </div>
                          )}
                        </dl>
                        <div className="material-schedule__cost">
                          <span>Стоимость</span>
                          <strong>{item.totalCost === null ? "—" : formatCurrency(item.totalCost)}</strong>
                        </div>
                        <small className="material-schedule__demo-note">Локальная демонстрационная цена, не предложение магазина.</small>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <p className="material-schedule__empty">Выберите материалы в помещениях — позиции ведомости появятся автоматически.</p>
      )}

      <footer className="material-schedule__object-total">
        <div>
          <p className="section-label">Итого по объекту</p>
          <dl>
            <div><dt>Материалов выбрано</dt><dd>{summary.selectedCount}</dd></div>
            <div><dt>Позиций к закупке</dt><dd>{summary.purchasePositionCount}</dd></div>
            <div><dt>Помещений</dt><dd>{rooms.length}</dd></div>
          </dl>
        </div>
        <dl className="material-schedule__surface-total">
          {surfaces.map((surface) => (
            <div key={surface}>
              <dt>{materialSurfaceLabels[surface]}</dt>
              <dd>{formatArea(summary.requiredAreaBySurface[surface])} м²</dd>
            </div>
          ))}
          {surfaces.map((surface) => (
            <div key={`${surface}-cost`}>
              <dt>Стоимость: {materialSurfaceLabels[surface].toLowerCase()}</dt>
              <dd>{formatCurrency(summary.costBySurface[surface])}</dd>
            </div>
          ))}
        </dl>
        <div className="material-schedule__grand-total">
          <span>Предварительная стоимость материалов</span>
          <strong>{formatCurrency(summary.totalCost)}</strong>
          <small>Расчёт выполнен по локальным демонстрационным ценам.</small>
        </div>
      </footer>
    </section>
  );
}
