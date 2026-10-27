import type { Metadata } from "next";

import { ContactCta } from "@/components/sections/contact-cta";
import { Process } from "@/components/sections/process";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "О студии",
  description: "FORMA — студия, которая ведёт дизайн и ремонт как единый процесс. Принципы работы, этапы и гарантии.",
  alternates: { canonical: "/studio" },
};

const principles = [
  { title: "Сначала планировка", text: "Красивые материалы не исправят неудобную квартиру. Мы начинаем с того, как вы двигаетесь по дому, где храните вещи и где проводите вечер." },
  { title: "Смета до старта", text: "Стоимость работ фиксируется в договоре. Если меняется объём — только по вашему письменному решению и с пересчётом." },
  { title: "Прозрачный объект", text: "Каждую неделю — фотоотчёт и короткий список сделанного. Скрытые работы принимаем до того, как их закроют отделкой." },
  { title: "Одна команда", text: "Дизайнер и прораб работают вместе с первого дня, поэтому чертежи учитывают реальные ограничения объекта." },
];

const guarantees = [
  { value: "2 года", label: "гарантия на работы" },
  { value: "1 раз", label: "в неделю фотоотчёт" },
  { value: "0 ₽", label: "доплат вне договора" },
];

export default function StudioPage() {
  return (
    <>
      <PageHero
        index="05"
        label="О студии"
        title="Интерьер как единая система"
        lead="Свет, материалы, пропорции и повседневные сценарии — мы собираем их вокруг человека, чтобы каждая деталь поддерживала целое."
      />
      <section className="content-section" aria-labelledby="principles-title">
        <Container>
          <div className="section-intro">
            <p className="section-label">Принципы</p>
            <h2 id="principles-title">Как мы принимаем решения</h2>
          </div>
          <ol className="principles">
            {principles.map((item, index) => (
              <li key={item.title}>
                <span className="item-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section className="content-section guarantees" aria-label="Гарантии">
        <Container>
          <dl className="guarantees__list">
            {guarantees.map((item) => (
              <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
            ))}
          </dl>
        </Container>
      </section>
      <Process />
      <ContactCta />
    </>
  );
}
