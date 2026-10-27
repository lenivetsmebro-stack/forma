const plannerSteps = [
  { number: "01", label: "Объект" },
  { number: "02", label: "Помещения" },
  { number: "03", label: "Материалы" },
  { number: "04", label: "Стиль" },
  { number: "05", label: "3D" },
  { number: "06", label: "Расчёт" },
];

export type PlannerStepNumber = 1 | 2 | 3 | 4 | 5;

type PlannerProgressProps = {
  currentStep: PlannerStepNumber;
  onStepSelect?: (step: PlannerStepNumber) => void;
};

export function PlannerProgress({ currentStep, onStepSelect }: PlannerProgressProps) {
  return (
    <nav className="planner-progress" aria-label="Этапы FORMA Planner">
      <ol>
        {plannerSteps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === currentStep;
          const complete = stepNumber < currentStep;
          const content = (
            <>
              <span aria-hidden="true">{step.number}</span>
              <span>{step.label}</span>
              {active && <span className="sr-only"> — текущий этап</span>}
              {complete && <span className="sr-only"> — завершён, вернуться</span>}
            </>
          );
          return (
            <li
              className={active ? "is-active" : complete ? "is-complete" : undefined}
              key={step.number}
              aria-current={active ? "step" : undefined}
            >
              {complete && onStepSelect ? (
                <button type="button" onClick={() => onStepSelect(stepNumber as PlannerStepNumber)}>
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
      <p>Следующие этапы откроются по мере заполнения. К пройденным можно вернуться, нажав на них.</p>
    </nav>
  );
}
