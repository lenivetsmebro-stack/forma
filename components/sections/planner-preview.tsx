import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const plannerSteps = [
  { number: "01", title: "Объект", description: "Дом или квартира" },
  { number: "02", title: "Размеры", description: "Площадь, комнаты и параметры помещений" },
  { number: "03", title: "Материалы", description: "Предварительный расчёт отделочных материалов" },
  { number: "04", title: "Стиль", description: "Выбор визуального направления интерьера" },
  { number: "05", title: "3D", description: "Просмотр пространства с разных ракурсов" },
];

export function PlannerPreview() {
  return (
    <section className="content-section planner" id="planner" aria-labelledby="planner-title">
      <Container>
        <div className="planner__intro">
          <div>
            <p className="section-label">FORMA Planner</p>
            <p className="planner__status">Planner находится в разработке</p>
          </div>
          <div>
            <h2 id="planner-title">Спроектируйте пространство до начала ремонта</h2>
            <p className="planner__summary">
              Интерактивный инструмент для работы с помещениями, размерами,
              материалами и будущей визуализацией интерьера.
            </p>
            <Button href="/planner" variant="secondary">Перейти в Planner</Button>
          </div>
        </div>

        <div className="planner__scheme" aria-label="Планируемые возможности FORMA Planner">
          <p className="planner__scheme-label">Roadmap / product preview</p>
          <ol className="planner__steps">
            {plannerSteps.map((step) => (
              <li className="planner__step" key={step.number}>
                <span className="planner__number" aria-hidden="true">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
