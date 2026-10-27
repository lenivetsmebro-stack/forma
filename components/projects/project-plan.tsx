import type { Project } from "@/lib/site-content";

type ProjectPlanProps = {
  project: Pick<Project, "plan" | "palette" | "title">;
  className?: string;
};

type Zone = { x: number; y: number; w: number; h: number; label: string; tone: number };

const LAYOUTS: Record<Project["plan"], Zone[]> = {
  linear: [
    { x: 0, y: 0, w: 230, h: 260, label: "Кухня-гостиная", tone: 0 },
    { x: 230, y: 0, w: 170, h: 130, label: "Спальня", tone: 3 },
    { x: 230, y: 130, w: 170, h: 130, label: "Детская", tone: 3 },
    { x: 0, y: 260, w: 270, h: 80, label: "Хранение", tone: 1 },
    { x: 270, y: 260, w: 130, h: 80, label: "Ванная", tone: 2 },
  ],
  open: [
    { x: 0, y: 0, w: 400, h: 190, label: "Гостиная · кухня · столовая", tone: 3 },
    { x: 0, y: 190, w: 150, h: 150, label: "Кабинет", tone: 0 },
    { x: 150, y: 190, w: 110, h: 150, label: "Лестница", tone: 2 },
    { x: 260, y: 190, w: 140, h: 150, label: "Гостевая", tone: 0 },
  ],
  split: [
    { x: 0, y: 0, w: 250, h: 210, label: "Студия", tone: 3 },
    { x: 250, y: 0, w: 150, h: 210, label: "Спальня", tone: 0 },
    { x: 0, y: 210, w: 160, h: 130, label: "Кухня", tone: 1 },
    { x: 160, y: 210, w: 120, h: 130, label: "Ванная", tone: 2 },
    { x: 280, y: 210, w: 120, h: 130, label: "Рабочее место", tone: 0 },
  ],
};

export function ProjectPlan({ project, className }: ProjectPlanProps) {
  const zones = LAYOUTS[project.plan];
  const tone = (index: number) => project.palette[index % project.palette.length]?.hex ?? "#ded9cf";
  return (
    <svg
      className={["project-plan", className].filter(Boolean).join(" ")}
      viewBox="-12 -12 424 364"
      role="img"
      aria-label={`Схема планировки проекта «${project.title}»`}
    >
      {zones.map((zone) => (
        <g key={zone.label}>
          <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} fill={tone(zone.tone)} fillOpacity={0.55} />
          <rect className="project-plan__wall" x={zone.x} y={zone.y} width={zone.w} height={zone.h} />
          <text x={zone.x + 12} y={zone.y + 24} className="project-plan__label">{zone.label}</text>
        </g>
      ))}
      <rect className="project-plan__outline" x={0} y={0} width={400} height={340} />
    </svg>
  );
}
