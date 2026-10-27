import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const services = [
  {
    number: "01",
    title: "Дизайн интерьера",
    description:
      "Формируем цельную концепцию пространства, планировочные решения и визуальный язык интерьера.",
  },
  {
    number: "02",
    title: "Ремонт под ключ",
    description:
      "Организуем реализацию проекта и связываем все рабочие процессы в одну последовательную систему.",
  },
  {
    number: "03",
    title: "Комплектация",
    description:
      "Подбираем материалы, мебель и предметы, поддерживающие общую логику пространства.",
  },
  {
    number: "04",
    title: "Авторский надзор",
    description:
      "Сопровождаем воплощение концепции и помогаем сохранять заложенные в проект решения.",
  },
];

export function ServicesPreview() {
  return (
    <section className="content-section services" id="services" aria-labelledby="services-title">
      <Container>
        <div className="section-intro">
          <p className="section-label">Услуги</p>
          <div>
            <h2 id="services-title">От идеи до готового пространства</h2>
            <p className="section-summary">
              FORMA объединяет дизайн и реализацию в одном последовательном
              процессе.
            </p>
          </div>
        </div>
        <ol className="services__list">
          {services.map((service) => (
            <li className="services__item" key={service.number}>
              <span className="item-number" aria-hidden="true">{service.number}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </li>
          ))}
        </ol>
        <div className="section-more">
          <Button href="/services" variant="secondary">Состав услуг и цены</Button>
        </div>
      </Container>
    </section>
  );
}
