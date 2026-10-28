import { Navigation } from "@/components/layout/navigation";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { developer } from "@/lib/site-content";

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
        <p>
          Концепт-проект для портфолио: студия, контакты и кейсы вымышлены.
          {developer.name && (
            <>
              {" "}Дизайн и разработка —{" "}
              {developer.site ? (
                <a href={developer.site} target="_blank" rel="noopener noreferrer">{developer.name}</a>
              ) : (
                developer.name
              )}
              {developer.bot ? (
                <>
                  {" · "}
                  <a href={`https://t.me/${developer.bot}?start=forma`} target="_blank" rel="noopener noreferrer">
                    Заказать такой сайт
                  </a>
                </>
              ) : developer.telegram ? (
                <>
                  {" · "}
                  <a href={`https://t.me/${developer.telegram}`} target="_blank" rel="noopener noreferrer">
                    @{developer.telegram}
                  </a>
                </>
              ) : null}
            </>
          )}
        </p>
      </Container>
    </footer>
  );
}
