import type { Metadata } from "next";

import { CostCalculator } from "@/components/forms/cost-calculator";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "Калькулятор стоимости ремонта",
  description: "Оцените стоимость и сроки ремонта квартиры или дома за минуту: тип ремонта, площадь, состояние объекта и дизайн-проект.",
  alternates: { canonical: "/calculator" },
};

export default function CalculatorPage() {
  return (
    <>
      <PageHero
        index="04"
        label="Калькулятор"
        title="Сколько стоит ремонт"
        lead="Быстрая оценка по средним ставкам студии. Для расчёта по помещениям и материалам откройте FORMA Planner."
      />
      <section className="content-section calculator-section" aria-label="Калькулятор">
        <Container>
          <CostCalculator />
        </Container>
      </section>
    </>
  );
}
