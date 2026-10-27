import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectPlan } from "@/components/projects/project-plan";
import { ContactCta } from "@/components/sections/contact-cta";
import { Container } from "@/components/ui/container";
import { projects } from "@/lib/site-content";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} — ${project.area} м²`,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const index = projects.findIndex((item) => item.slug === slug);
  const project = projects[index];
  if (!project) notFound();
  const next = projects[(index + 1) % projects.length];

  return (
    <>
      <article className="case">
        <Container>
          <Link className="case__back" href="/projects">← Все проекты</Link>
          <header className="case__header">
            <p className="eyebrow"><span aria-hidden="true">{project.number}</span><span>{project.type}</span></p>
            <h1>{project.title}</h1>
            <p className="case__summary">{project.summary}</p>
          </header>

          <dl className="case__facts">
            <div><dt>Площадь</dt><dd>{project.area} м²</dd></div>
            <div><dt>Помещения</dt><dd>{project.rooms}</dd></div>
            <div><dt>Срок</dt><dd>{project.duration}</dd></div>
            <div><dt>Бюджет</dt><dd>{project.budget}</dd></div>
            <div><dt>Год</dt><dd>{project.year}</dd></div>
          </dl>

          <div className="case__visual">
            <ProjectPlan project={project} />
          </div>

          <div className="case__grid">
            <section aria-labelledby="case-challenge">
              <p className="section-label" id="case-challenge">Задача</p>
              <p className="case__text">{project.challenge}</p>
            </section>
            <section aria-labelledby="case-solution">
              <p className="section-label" id="case-solution">Решение</p>
              <ol className="case__solution">
                {project.solution.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </section>
            <section aria-labelledby="case-palette">
              <p className="section-label" id="case-palette">Материалы</p>
              <ul className="case__palette">
                {project.palette.map((swatch) => (
                  <li key={swatch.hex}>
                    <span style={{ background: swatch.hex }} aria-hidden="true" />
                    {swatch.name}
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="case-result">
              <p className="section-label" id="case-result">Результат</p>
              <p className="case__result">{project.result}</p>
            </section>
          </div>

          {next && next.slug !== project.slug && (
            <Link className="case__next" href={`/projects/${next.slug}`}>
              <span className="section-label">Следующий проект</span>
              <strong>{next.title} →</strong>
            </Link>
          )}
        </Container>
      </article>
      <ContactCta />
    </>
  );
}
