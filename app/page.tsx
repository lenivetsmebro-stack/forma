import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ContactCta } from "@/components/sections/contact-cta";
import { PlannerPreview } from "@/components/sections/planner-preview";
import { Process } from "@/components/sections/process";
import { ProjectsPreview } from "@/components/sections/projects-preview";
import { ServicesPreview } from "@/components/sections/services-preview";
import { StudioPreview } from "@/components/sections/studio-preview";

export default function Home() {
  return (
    <>
      <section className="foundation-hero" aria-labelledby="foundation-title">
        <Container className="foundation-hero__inner">
          <p className="eyebrow">
            <span aria-hidden="true">01</span>
            <span>FORMA / интерьер и ремонт</span>
          </p>

          <div className="foundation-hero__content">
            <h1 id="foundation-title">
              Пространство, собранное вокруг вашей жизни
            </h1>
            <div className="foundation-hero__aside">
              <p className="foundation-hero__copy">
                Продумываем интерьер и ведём ремонт как единый процесс —
                спокойно, последовательно и с вниманием к каждой детали.
              </p>
              <div className="foundation-hero__actions">
                <Button href="#contacts">Обсудить проект</Button>
                <Button href="/planner" variant="secondary">
                  Открыть FORMA Planner
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <ServicesPreview />
      <PlannerPreview />
      <ProjectsPreview />
      <Process />
      <StudioPreview />
      <ContactCta />
    </>
  );
}
