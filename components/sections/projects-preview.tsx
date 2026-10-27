import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { projects } from "@/lib/site-content";

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
            <li className="projects__item" key={project.slug}>
              <Link className="projects__link" href={`/projects/${project.slug}`}>
                <div className="projects__meta">
                  <span className="item-number" aria-hidden="true">{project.number}</span>
                  <span className="projects__note">{project.area} м² · {project.duration}</span>
                </div>
                <div className="projects__body">
                  <p className="projects__type">{project.type}</p>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <div className="section-more">
          <Button href="/projects" variant="secondary">Все проекты</Button>
        </div>
      </Container>
    </section>
  );
}
