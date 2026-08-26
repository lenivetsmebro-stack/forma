import { getDesignSpecifications, isDesignStepComplete } from "@/components/planner/design-utils";
import { getStyleById } from "@/components/planner/style-catalog";
import type { PlannerDesignData, PlannerRoom } from "@/components/planner/types";

type StyleSummaryProps = { rooms: PlannerRoom[]; design: PlannerDesignData };

export function StyleSummary({ rooms, design }: StyleSummaryProps) {
  const specifications = getDesignSpecifications(rooms, design);
  const globalStyle = getStyleById(design.globalStyleId);
  const complete = isDesignStepComplete(design, rooms);

  return (
    <aside className="style-summary" aria-labelledby="style-summary-title" aria-live="polite">
      <p className="section-label">Live summary</p>
      <h2 id="style-summary-title">Дизайн</h2>
      <dl>
        <div><dt>Режим</dt><dd>{design.mode === "global" ? "Единый" : "По комнатам"}</dd></div>
        {design.mode === "global" && (
          <div><dt>Стиль</dt><dd>{globalStyle?.name ?? "Не выбран"}</dd></div>
        )}
        <div><dt>Комнат</dt><dd>{rooms.length}</dd></div>
      </dl>

      {design.mode === "per-room" && (
        <ul>
          {rooms.map((room, index) => {
            const specification = specifications.find((item) => item.roomId === room.id);
            return (
              <li key={room.id}>
                <span>{specification?.roomName ?? `Помещение ${index + 1}`}</span>
                <strong>{specification?.styleName ?? "Не выбран"}</strong>
              </li>
            );
          })}
        </ul>
      )}

      <div className={`style-summary__state${complete ? " is-ready" : ""}`}>
        <strong>{complete ? "Дизайн-направление готово" : "Завершите выбор стиля"}</strong>
        <p>{complete ? "Следующий этап — 3D-визуализация пространства." : "Выберите стиль для всего объекта или каждой комнаты."}</p>
      </div>
    </aside>
  );
}
