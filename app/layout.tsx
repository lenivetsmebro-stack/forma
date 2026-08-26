import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

import "./globals.css";

export const metadata: Metadata = {
  title: "FORMA — ремонт и интерьер",
  description:
    "Студия ремонта квартир и дизайна интерьеров с вниманием к пространству и деталям.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <main className="site-main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
