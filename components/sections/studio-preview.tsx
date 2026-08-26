import { Container } from "@/components/ui/container";

export function StudioPreview() {
  return (
    <section className="content-section studio" id="studio" aria-labelledby="studio-title">
      <Container className="studio__inner">
        <p className="section-label">О студии</p>
        <h2 id="studio-title">
          Интерьер — это единая система света, материалов, пропорций и
          повседневных сценариев, а не набор отдельных решений.
        </h2>
        <p className="studio__copy">
          FORMA собирает эти элементы вокруг человека и пространства, чтобы
          каждая деталь поддерживала целое.
        </p>
      </Container>
    </section>
  );
}
