import type { Metadata } from "next";

import { ContactForm } from "@/components/forms/contact-form";
import { Container } from "@/components/ui/container";
import { PACKAGES } from "@/lib/estimate";
import type { Package } from "@/lib/estimate";
import { siteConfig } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Оставьте заявку на ремонт или дизайн-проект — перезвоним в течение рабочего дня и договоримся о выезде на объект.",
  alternates: { canonical: "/contacts" },
};

export default async function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  const params = await searchParams;
  const area = Number(typeof params.area === "string" ? params.area : NaN);
  const packKey = typeof params.pack === "string" && params.pack in PACKAGES ? (params.pack as Package) : null;
  const initialMessage = Number.isFinite(area) && area > 0 && packKey
    ? `Площадь ${area} м², ${PACKAGES[packKey].label.toLowerCase()} ремонт. Хочу получить точную смету.`
    : "";

  return (
    <section className="contacts" aria-labelledby="page-title">
      <Container className="contacts__inner">
        <div className="contacts__info">
          <p className="eyebrow"><span aria-hidden="true">06</span><span>Контакты</span></p>
          <h1 id="page-title">Начнём с вашего пространства</h1>
          <p className="contacts__lead">Перезвоним в течение рабочего дня, ответим на вопросы и договоримся о бесплатном выезде на замер.</p>
          <dl className="contacts__details">
            <div><dt>Телефон</dt><dd><a href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}>{siteConfig.phone}</a></dd></div>
            <div><dt>Почта</dt><dd><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></dd></div>
            <div><dt>Город</dt><dd>{siteConfig.city}</dd></div>
            <div><dt>Часы</dt><dd>{siteConfig.hours}</dd></div>
          </dl>
        </div>
        <ContactForm initialMessage={initialMessage} />
      </Container>
    </section>
  );
}
