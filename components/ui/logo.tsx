import Link from "next/link";

type LogoProps = { className?: string };

export function Logo({ className }: LogoProps) {
  return (
    <Link
      className={["logo", className].filter(Boolean).join(" ")}
      href="/"
      aria-label="FORMA — на главную"
    >
      FORMA
    </Link>
  );
}
