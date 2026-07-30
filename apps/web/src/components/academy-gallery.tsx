interface AcademyGalleryImage {
  type: string;
  order: number;
  url: string;
  sourceUrl?: string | null;
}

interface AcademyGalleryProps {
  logoUrl?: string | null;
  gallery: AcademyGalleryImage[];
}

export function AcademyGallery({ logoUrl, gallery }: AcademyGalleryProps) {
  if (!logoUrl && gallery.length === 0) return null;

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">학원 이미지</h2>

      {logoUrl ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
          <img src={logoUrl} alt="학원 로고" className="mx-auto max-h-16 w-auto object-contain" />
        </div>
      ) : null}

      {gallery.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {gallery
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((image) => (
              <figure
                key={`${image.order}-${image.url}`}
                className="overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/70"
              >
                <img
                  src={image.url}
                  alt={`학원 내부 ${image.order}`}
                  className="aspect-[4/5] w-full object-cover"
                />
              </figure>
            ))}
        </div>
      ) : null}
    </section>
  );
}
