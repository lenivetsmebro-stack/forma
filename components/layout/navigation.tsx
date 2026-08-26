const navigationItems = [
  { href: "#services", label: "Услуги" },
  { href: "#projects", label: "Проекты" },
  { href: "#studio", label: "О студии" },
  { href: "#contacts", label: "Контакты" },
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
            <a className="navigation__link" href={item.href}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
