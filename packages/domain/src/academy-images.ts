export type AcademyGalleryImageType = "logo" | "interior";

export interface AcademyGalleryImage {
  type: AcademyGalleryImageType;
  order: number;
  url: string;
  sourceUrl?: string | null;
}

export interface RawAcademyImages {
  logoUrl: string | null;
  gallery: AcademyGalleryImage[];
  companyProfileUrl?: string | null;
}

export interface StoredAcademyImages {
  logoUrl: string | null;
  gallery: AcademyGalleryImage[];
}
