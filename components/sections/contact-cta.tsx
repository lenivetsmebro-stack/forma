import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function ContactCta() {
  return (
    <section className="contact-cta" id="contacts" aria-labelledby="contact-title">
      <Container className="contact-cta__inner">
        <p className="section-label">Начало проекта</p>
        <div className="contact-cta__content">
          <h2 id="contact-title">Начнём с вашего пространства</h2>
          <div className="contact-cta__aside">
            <p>Обсудим задачу, формат проекта и следующий шаг.</p>
            <div className="contact-cta__actions">
              <Button href="/planner">Рассчитать стоимость</Button>
              <Button href="#contacts" variant="secondary">Обсудить проект</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
