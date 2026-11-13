# Статические сайты Даниила Демьяненко («Кёниг Код»)

Ветка `static-sites` хранит исходники всех статических сайтов. Каждая папка — отдельный проект на Vercel.

| Папка | Сайт | Проект Vercel |
|---|---|---|
| `portfolio/` | https://daniil-demyanenko.vercel.app | daniil-demyanenko |
| `luma/` | https://luma-studio-roan.vercel.app | luma-studio |
| `kant/` | https://kant-store-demo.vercel.app | kant-store-demo |

В каждой папке: `index.html`, `privacy.html` (политика ПДн), `consent.html` (согласие), `robots.txt`, `sitemap.xml`, `fonts.css` + `fonts/` (шрифты лежат на самом сайте, без Google Fonts).

Next.js-сайты FORMA и NORD GARAGE живут в ветках `main` своих репозиториев и выкладываются автоматически при пуше.

Корневой `vercel.json` отключает автосборку этой ветки в проекте FORMA: ветка просто хранится в репозитории forma.
