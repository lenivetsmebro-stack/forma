import type { InteriorStyleDefinition } from "@/components/planner/types";

export const styleCatalog: InteriorStyleDefinition[] = [
  {
    id: "minimalism",
    name: "Минимализм",
    shortDescription: "Чистые линии, спокойная палитра и минимум визуального шума.",
    palette: [
      { name: "Молочный", hex: "#F3F0EA" }, { name: "Тёплый белый", hex: "#DDD8CF" },
      { name: "Серо-бежевый", hex: "#B8B1A6" }, { name: "Серый", hex: "#76736C" },
      { name: "Графит", hex: "#262623" },
    ],
    materials: ["дерево", "камень", "штукатурка", "матовый металл"],
    mood: ["спокойный", "лаконичный", "функциональный"],
    keywords: ["clean", "warm", "minimal", "functional"],
  },
  {
    id: "contemporary",
    name: "Современный",
    shortDescription: "Выверенные пропорции, выразительные фактуры и гибкая нейтральная основа.",
    palette: [
      { name: "Светлый песок", hex: "#E9E3D9" }, { name: "Кашемир", hex: "#CFC3B4" },
      { name: "Тауп", hex: "#9B8F82" }, { name: "Сланец", hex: "#55534F" },
      { name: "Угольный", hex: "#242424" },
    ],
    materials: ["дерево", "керамогранит", "стекло", "металл"],
    mood: ["собранный", "актуальный", "комфортный"],
    keywords: ["contemporary", "balanced", "textural", "neutral"],
  },
  {
    id: "scandinavian",
    name: "Скандинавский",
    shortDescription: "Свет, натуральное дерево и простые решения для повседневного комфорта.",
    palette: [
      { name: "Снежный", hex: "#F4F2EC" }, { name: "Лён", hex: "#DDD5C7" },
      { name: "Светлый дуб", hex: "#C1A984" }, { name: "Шалфей", hex: "#879083" },
      { name: "Мягкий графит", hex: "#414340" },
    ],
    materials: ["светлое дерево", "лён", "шерсть", "матовая керамика"],
    mood: ["светлый", "естественный", "уютный"],
    keywords: ["scandinavian", "light", "natural", "cozy"],
  },
  {
    id: "japandi",
    name: "Japandi",
    shortDescription: "Японская сдержанность и скандинавское тепло в тактильной композиции.",
    palette: [
      { name: "Рисовая бумага", hex: "#EEE9DF" }, { name: "Натуральный лён", hex: "#C9BBA5" },
      { name: "Тёплое дерево", hex: "#9C8064" }, { name: "Кора", hex: "#6C5C4D" },
      { name: "Тёмный камень", hex: "#33312C" },
    ],
    materials: ["дерево", "камень", "штукатурка", "лён"],
    mood: ["спокойный", "тёплый", "натуральный"],
    keywords: ["japandi", "calm", "warm", "crafted"],
  },
  {
    id: "loft",
    name: "Лофт",
    shortDescription: "Открытая структура, грубые фактуры и точные индустриальные акценты.",
    palette: [
      { name: "Бетон", hex: "#D1CEC8" }, { name: "Старая древесина", hex: "#8A837A" },
      { name: "Тёмный кирпич", hex: "#5C5751" }, { name: "Железо", hex: "#34312E" },
      { name: "Чёрный", hex: "#171716" },
    ],
    materials: ["бетон", "кирпич", "тёмное дерево", "чёрный металл"],
    mood: ["выразительный", "индустриальный", "свободный"],
    keywords: ["loft", "industrial", "raw", "contrast"],
  },
  {
    id: "neoclassic",
    name: "Неоклассика",
    shortDescription: "Симметрия и классические детали в спокойной современной интерпретации.",
    palette: [
      { name: "Слоновая кость", hex: "#F0EBE1" }, { name: "Шампань", hex: "#D9CCB8" },
      { name: "Пыльная роза", hex: "#BCA89E" }, { name: "Бронза", hex: "#8B765E" },
      { name: "Тёмный орех", hex: "#403831" },
    ],
    materials: ["мрамор", "шпон", "лепнина", "латунь"],
    mood: ["элегантный", "уравновешенный", "торжественный"],
    keywords: ["neoclassic", "symmetry", "elegant", "refined"],
  },
  {
    id: "modern-classic",
    name: "Современная классика",
    shortDescription: "Мягкая классическая основа, лаконичная мебель и деликатные акценты.",
    palette: [
      { name: "Кремовый", hex: "#F1ECE3" }, { name: "Светлый тауп", hex: "#D5C9BC" },
      { name: "Какао", hex: "#9C8574" }, { name: "Олива", hex: "#777564" },
      { name: "Глубокий серый", hex: "#393A38" },
    ],
    materials: ["дерево", "натуральный камень", "текстиль", "сатинированный металл"],
    mood: ["мягкий", "элегантный", "вневременной"],
    keywords: ["modern-classic", "timeless", "soft", "elegant"],
  },
  {
    id: "wabi-sabi",
    name: "Wabi-sabi",
    shortDescription: "Естественная несовершенность, ручные фактуры и тихая природная палитра.",
    palette: [
      { name: "Мел", hex: "#E8E1D5" }, { name: "Глина", hex: "#C6AE92" },
      { name: "Сухая трава", hex: "#A18F70" }, { name: "Земля", hex: "#756555" },
      { name: "Обожжённое дерево", hex: "#302D29" },
    ],
    materials: ["глина", "необработанное дерево", "камень", "фактурная штукатурка"],
    mood: ["тихий", "тактильный", "созерцательный"],
    keywords: ["wabi-sabi", "organic", "imperfect", "tactile"],
  },
];

export function getStyleById(styleId: string | null | undefined) {
  return styleCatalog.find((style) => style.id === styleId);
}
