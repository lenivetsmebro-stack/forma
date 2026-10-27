import type { Metadata } from "next";
import Link from "next/link";

import { ProjectPlan } from "@/components/projects/project-plan";
import { ContactCta } from "@/components/sections/contact-cta";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { projects } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Проекты",
  description: "Кейсы FORMA: квартиры, дома и апартаменты — задача, планировочное решение, материалы и результат.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        index="03"
        label="Проекты"
        title="Три сценария пространства"
        lead="Каждый кейс начинается с ограничения: мало света, мало метров или неудачная нарезка комнат. Ниже — как мы с ними работали."
      />
      <section className="content-section project-index" aria-label="Список проектов">
        <Container>
          <ol className="project-index__list">
            {projects.map((project) => (
              <li key={project.slug}>
                <Link className="project-tile" href={`/projects/${project.slug}`}>
                  <div className="project-tile__visual">
                    <ProjectPlan project={project} />
                  </div>
                  <div className="project-tile__body">
                    <p className="projects__type">{project.number} · {project.type}</p>
                    <h2>{project.title}</h2>
                    <p>{project.summary}</p>
                    <dl className="project-tile__facts">
                      <div><dt>Площадь</dt><dd>{project.area} м²</dd></div>
                      <div><dt>Срок</dt><dd>{project.duration}</dd></div>
                      <div><dt>Бюджет</dt><dd>{project.budget}</dd></div>
                    </dl>
                    <span className="project-tile__more">Смотреть кейс →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <p className="project-index__note">Концептуальные кейсы портфолио: планировки и цифры приведены для демонстрации подхода.</p>
        </Container>
      </section>
      <ContactCta />
    </>
  );
}
