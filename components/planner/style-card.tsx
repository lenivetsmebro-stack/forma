import type { InteriorStyleDefinition } from "@/components/planner/types";

type StyleCardProps = {
  style: InteriorStyleDefinition;
  name: string;
  selected: boolean;
  onSelect: () => void;
};

export function StyleCard({ style, name, selected, onSelect }: StyleCardProps) {
  return (
    <label className={`style-card${selected ? " is-selected" : ""}`}>
      <input
        type="radio"
        name={name}
        value={style.id}
        checked={selected}
        onChange={onSelect}
      />
      <span className="style-card__content">
        <span className="style-card__status">{selected ? "Выбран" : "Выбрать стиль"}</span>
        <strong>{style.name}</strong>
        <span className="style-card__description">{style.shortDescription}</span>
        <span className="style-card__palette" aria-label={`Палитра: ${style.palette.map((color) => color.name).join(", ")}`}>
          {style.palette.map((color) => (
            <i key={color.hex} style={{ backgroundColor: color.hex }} title={color.name} />
          ))}
        </span>
        <span className="style-card__meta">
          <span><small>Материалы</small>{style.materials.join(" · ")}</span>
          <span><small>Настроение</small>{style.mood.join(" · ")}</span>
        </span>
      </span>
    </label>
  );
}
