interface AcademyGalleryImage {
  type: string;
  order: number;
  url: string;
  sourceUrl?: string | null;
}

interface AcademyGalleryProps {
  logoUrl?: string | null;
  gallery: AcademyGalleryImage[];
  /** Parent already provides section chrome (title / border-t). */
  embedded?: boolean;
}

export function AcademyGallery({
  logoUrl,
  gallery,
  embedded = false,
}: AcademyGalleryProps) {
  if (!logoUrl && gallery.length === 0) return null;

  const body = (
    <>
      {logoUrl ? (
        <div className="overflow-hidden rounded-2xl bg-surface-muted p-4">
          <img
            src={logoUrl}
            alt="학원 로고"
            className="mx-auto max-h-16 w-auto object-contain"
          />
        </div>
      ) : null}

      {gallery.length > 0 ? (
        <div
          className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${logoUrl ? "mt-3" : ""}`}
        >
          {gallery
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((image) => (
              <figure
                key={`${image.order}-${image.url}`}
                className="overflow-hidden rounded-2xl bg-surface-muted"
              >
                <img
                  src={image.url}
                  alt={`학원 내부 ${image.order}`}
                  className="aspect-4/5 w-full object-cover"
                />
              </figure>
            ))}
        </div>
      ) : null}
    </>
  );

  if (embedded) return body;

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">학원 이미지</h2>
      {body}
    </section>
  );
}
