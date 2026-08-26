import Link from "next/link";

const navigationItems = [
  { href: "/#services", label: "Услуги" },
  { href: "/#planner", label: "Planner" },
  { href: "/#projects", label: "Проекты" },
  { href: "/#studio", label: "О студии" },
  { href: "/#contacts", label: "Контакты" },
];

type NavigationProps = { className?: string; label?: string };

export function Navigation({
  className,
  label = "Основная навигация",
}: NavigationProps) {
  return (
    <nav
      className={["navigation", className].filter(Boolean).join(" ")}
      aria-label={label}
    >
      <ul className="navigation__list">
        {navigationItems.map((item) => (
          <li key={item.href}>
            <Link className="navigation__link" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
