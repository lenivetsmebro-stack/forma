import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <Container className="page-hero__inner">
        <p className="eyebrow"><span aria-hidden="true">404</span><span>Страница не найдена</span></p>
        <div className="page-hero__content">
          <h1 id="page-title">Этой комнаты нет в планировке</h1>
          <div className="page-hero__aside">
            <p className="page-hero__lead">Возможно, ссылка устарела. Начните с главной или посмотрите проекты.</p>
            <div className="page-hero__actions">
              <Button href="/">На главную</Button>
              <Button href="/projects" variant="secondary">Проекты</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
