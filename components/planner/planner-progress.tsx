const plannerSteps = [
  { number: "01", label: "Объект" },
  { number: "02", label: "Помещения" },
  { number: "03", label: "Материалы" },
  { number: "04", label: "Стиль" },
  { number: "05", label: "3D" },
  { number: "06", label: "Расчёт" },
];

type PlannerProgressProps = { currentStep: 1 | 2 | 3 };

export function PlannerProgress({ currentStep }: PlannerProgressProps) {
  return (
    <nav className="planner-progress" aria-label="Этапы FORMA Planner">
      <ol>
        {plannerSteps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === currentStep;
          const complete = stepNumber < currentStep;
          return (
            <li
              className={active ? "is-active" : complete ? "is-complete" : undefined}
              key={step.number}
            >
              <span aria-hidden="true">{step.number}</span>
              <span>{step.label}</span>
              {active && <span className="sr-only"> — текущий этап</span>}
              {complete && <span className="sr-only"> — завершён</span>}
            </li>
          );
        })}
      </ol>
      <p>Следующие этапы будут доступны позже</p>
    </nav>
  );
}
