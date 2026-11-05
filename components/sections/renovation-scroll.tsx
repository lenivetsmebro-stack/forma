"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Stage = {
  src: string;
  label: string;
  title: string;
  text: string;
};

const STAGES: Stage[] = [
  {
    src: "/renovation/s1-concrete",
    label: "01",
    title: "Бетонная коробка",
    text: "Обмеры, техническое задание и проект. До первого удара перфоратора мы знаем, где будет каждая розетка.",
  },
  {
    src: "/renovation/s2-rough",
    label: "02",
    title: "Черновые работы",
    text: "Электрика, штукатурка, стяжка, каркас потолка. Скрытые работы фотографируем и сдаём вам поэтапно.",
  },
  {
    src: "/renovation/s3-finish",
    label: "03",
    title: "Чистовая отделка",
    text: "Покраска, пол, свет, кухня. Материалы закупаем по смете, без сюрпризов в конце.",
  },
  {
    src: "/renovation/s4-final",
    label: "04",
    title: "Ваш дом",
    text: "Мебель, текстиль и детали. Вы заезжаете в готовое пространство.",
  },
];

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function RenovationScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      setProgress(total > 0 ? clamp(-rect.top / total) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Position along the stages: 0 … STAGES.length - 1
  const segments = STAGES.length - 1;
  const position = clamp(progress * 1.08, 0, 1) * segments;
  const active = Math.min(segments, Math.round(position));

  return (
    <section
      ref={sectionRef}
      className="reno-scroll"
      aria-label="Этапы ремонта: от бетона до готового интерьера"
      style={{ height: `${STAGES.length * 100 + 60}vh` }}
    >
      <div className="reno-scroll__sticky">
        <div className="reno-scroll__frames" aria-hidden="true">
          {STAGES.map((stage, i) => {
            // Each frame fades in over the second half of the segment before it.
            const opacity = i === 0 ? 1 : clamp((position - (i - 1)) * 1.6 - 0.3);
            const scale = 1.08 - 0.08 * clamp(position / segments);
            return (
              <picture key={stage.src}>
                <source
                  type="image/webp"
                  srcSet={`${stage.src}-960.webp 960w, ${stage.src}-1600.webp 1600w`}
                  sizes="100vw"
                />
                <img
                  className="reno-scroll__img"
                  src={`${stage.src}-1600.jpg`}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  style={{ opacity, transform: `scale(${scale})` }}
                />
              </picture>
            );
          })}
          <div className="reno-scroll__shade" />
        </div>

        <div className="reno-scroll__ui">
          <p className="reno-scroll__eyebrow">
            От бетона до ключей
            <span>Прокрутите вниз</span>
          </p>

          <div className="reno-scroll__caption" aria-live="polite">
            {STAGES.map((stage, i) => (
              <div
                key={stage.label}
                className="reno-scroll__step"
                data-active={i === active || undefined}
              >
                <span className="reno-scroll__num">{stage.label}</span>
                <h2>{stage.title}</h2>
                <p>{stage.text}</p>
              </div>
            ))}
          </div>

          <div className="reno-scroll__bottom">
            <ol className="reno-scroll__track">
              {STAGES.map((stage, i) => (
                <li key={stage.label} data-done={position >= i - 0.05 || undefined}>
                  <span>{stage.label}</span> {stage.title}
                </li>
              ))}
            </ol>
            <div
              className="reno-scroll__cta"
              data-visible={active === segments || undefined}
            >
              <Button href="/calculator">Рассчитать ремонт</Button>
            </div>
          </div>

          <div className="reno-scroll__bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
