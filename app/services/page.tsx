import type { Metadata } from "next";

import { ContactCta } from "@/components/sections/contact-cta";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/button";
import { faq, services } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Услуги и цены",
  description: "Дизайн интерьера, ремонт под ключ, комплектация и авторский надзор. Что входит в каждую услугу, сроки и ориентиры по стоимости.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        index="02"
        label="Услуги"
        title="Дизайн и ремонт одной командой"
        lead="Можно заказать любой этап отдельно, но лучше всего FORMA работает, когда проект и реализация ведутся вместе: решения не теряются между чертежом и объектом."
      >
        <div className="page-hero__actions">
          <Button href="/calculator">Рассчитать стоимость</Button>
          <Button href="/contacts" variant="secondary">Обсудить проект</Button>
        </div>
      </PageHero>

      <section className="content-section services" aria-label="Список услуг">
        <Container>
          <ol className="service-cards">
            {services.map((service) => (
              <li className="service-card" key={service.slug} id={service.slug}>
                <div className="service-card__head">
                  <span className="item-number" aria-hidden="true">{service.number}</span>
                  <h2>{service.title}</h2>
                  <p>{service.lead}</p>
                </div>
                <dl className="service-card__facts">
                  <div><dt>Стоимость</dt><dd>{service.price}</dd></div>
                  <div><dt>Срок</dt><dd>{service.duration}</dd></div>
                </dl>
                <div className="service-card__includes">
                  <p className="section-label">Что входит</p>
                  <ul>
                    {service.includes.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="content-section faq" aria-labelledby="faq-title">
        <Container>
          <div className="section-intro">
            <p className="section-label">Вопросы</p>
            <h2 id="faq-title">Частые вопросы перед стартом</h2>
          </div>
          <div className="faq__list">
            {faq.map((item) => (
              <details className="faq__item" key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
      <ContactCta />
    </>
  );
}
