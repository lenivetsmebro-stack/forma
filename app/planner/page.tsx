import Link from "next/link";

import { PlannerShell } from "@/components/planner/planner-shell";
import { Container } from "@/components/ui/container";

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
