import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";

type PageHeroProps = {
  index: string;
  label: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
};

export function PageHero({ index, label, title, lead, children }: PageHeroProps) {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <Container className="page-hero__inner">
        <p className="eyebrow">
          <span aria-hidden="true">{index}</span>
          <span>{label}</span>
        </p>
        <div className="page-hero__content">
          <h1 id="page-title">{title}</h1>
          {(lead || children) && (
            <div className="page-hero__aside">
              {lead && <p className="page-hero__lead">{lead}</p>}
              {children}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
