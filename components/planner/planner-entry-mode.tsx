export type PlannerEntryMode = "manual" | "import";

type PlannerEntryModeProps = {
  value: PlannerEntryMode;
  onChange: (mode: PlannerEntryMode) => void;
};

const modes: Array<{
  value: PlannerEntryMode;
  title: string;
  description: string;
}> = [
  {
    value: "manual",
    title: "Создать вручную",
    description: "Задать площадь, помещения и параметры объекта.",
  },
  {
    value: "import",
    title: "Загрузить готовую планировку",
    description: "Подготовить JPG, PNG или PDF к будущей разметке.",
  },
];

export function PlannerEntryModeControl({
  value,
  onChange,
}: PlannerEntryModeProps) {
  return (
    <fieldset className="planner-entry-mode">
      <legend>Способ создания объекта</legend>
      <div>
        {modes.map((mode) => (
          <label key={mode.value}>
            <input
              type="radio"
              name="plannerEntryMode"
              value={mode.value}
              checked={value === mode.value}
              onChange={() => onChange(mode.value)}
            />
            <span>
              <strong>{mode.title}</strong>
              <small>{mode.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
