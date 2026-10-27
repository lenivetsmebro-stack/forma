import { Container } from "@/components/ui/container";
import { processSteps } from "@/lib/site-content";

const steps = processSteps;

export function Process() {
  return (
    <section className="content-section process" id="process" aria-labelledby="process-title">
      <Container>
        <div className="section-intro section-intro--compact">
          <p className="section-label">Подход</p>
          <h2 id="process-title">Путь от задачи к интерьеру</h2>
        </div>
        <ol className="process__list">
          {steps.map((step) => (
            <li className="process__item" key={step.number}>
              <span className="item-number" aria-hidden="true">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
