import { Navigation } from "@/components/layout/navigation";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <Container className="site-footer__main">
        <div className="site-footer__intro">
          <Logo />
          <p>Интерьер и ремонт, объединённые одной ясной концепцией.</p>
        </div>
        <Navigation
          className="site-footer__navigation"
          label="Навигация в подвале"
        />
      </Container>
      <Container className="site-footer__meta">
        <p>Portfolio / demo project</p>
      </Container>
    </footer>
  );
}
