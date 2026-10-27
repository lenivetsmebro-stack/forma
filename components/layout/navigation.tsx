import Link from "next/link";

import { navigationItems } from "@/lib/site-content";

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
