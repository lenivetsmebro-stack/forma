import { Container } from "@/components/ui/container";

const projects = [
  {
    number: "01",
    title: "Тихая квартира",
    type: "квартира / интерьер",
    description: "Сдержанное пространство с мягким светом и ясным ритмом материалов.",
  },
  {
    number: "02",
    title: "Дом у воды",
    type: "дом / интерьер",
    description: "Концепция, построенная на естественных оттенках и связи с окружением.",
  },
  {
    number: "03",
    title: "Городской ритм",
    type: "апартаменты / интерьер",
    description: "Точный, собранный интерьер для спокойной жизни в динамичном городе.",
  },
];

export function ProjectsPreview() {
  return (
    <section className="content-section projects" id="projects" aria-labelledby="projects-title">
      <Container>
        <div className="section-intro section-intro--compact">
          <p className="section-label">Избранные проекты</p>
          <h2 id="projects-title">Три сценария пространства</h2>
        </div>
        <ol className="projects__list">
          {projects.map((project) => (
            <li className="projects__item" key={project.number}>
              <div className="projects__meta">
                <span className="item-number" aria-hidden="true">{project.number}</span>
                <span className="projects__note">Концептуальный пример</span>
              </div>
              <div className="projects__body">
                <p className="projects__type">{project.type}</p>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
