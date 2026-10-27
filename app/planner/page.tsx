import type { Metadata } from "next";
import Link from "next/link";

import { PlannerShell } from "@/components/planner/planner-shell";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "FORMA Planner — планировщик ремонта",
  description: "Задайте помещения, поверхности и материалы или загрузите готовую планировку — Planner посчитает объёмы и покажет комнату в 3D.",
  alternates: { canonical: "/planner" },
};

export default function PlannerPage() {
  return (
    <div className="planner-page">
      <Container>
        <Link className="planner-page__back" href="/">
          <span aria-hidden="true">←</span>
          Вернуться на главную
        </Link>
        <PlannerShell />
      </Container>
    </div>
  );
}
