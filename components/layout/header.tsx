import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

export function Header() {
  return (
    <header className="site-header">
      <Container className="site-header__inner">
        <Logo />
        <Navigation className="site-header__navigation" />
        <Button className="site-header__cta" href="#contacts" variant="secondary">
          Рассчитать стоимость
        </Button>
      </Container>
    </header>
  );
}
