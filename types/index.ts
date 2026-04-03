import type { Property, PropertyImage, PropertyType, ListingType, ListingStatus, Inquiry, InquiryStatus, Testimonial } from "@prisma/client";

export type PropertyWithImages = Property & {
  images: PropertyImage[];
};

export type PropertyWithDetails = Property & {
  images: PropertyImage[];
  inquiries?: Inquiry[];
};

export type PropertyFilters = {
  listingType?: ListingType;
  type?: PropertyType;
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  rooms?: number;
  features?: string[];
  isFeatured?: boolean;
  status?: ListingStatus;
  search?: string;
  page?: number;
  sort?: string;
};

export type PaginatedProperties = {
  properties: PropertyWithImages[];
  total: number;
  page: number;
  totalPages: number;
};

export type InquiryWithProperty = Inquiry & {
  property?: Pick<Property, "id" | "slug" | "titleUk" | "titleEn"> | null;
};

export type CreatePropertyInput = {
  titleUk: string;
  titleEn: string;
  descriptionUk: string;
  descriptionEn: string;
  type: PropertyType;
  listingType: ListingType;
  status: ListingStatus;
  price: number;
  currency: string;
  areaSqm: number;
  landAreaSqm?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  features: string[];
  isFeatured: boolean;
};

export type { Property, PropertyImage, PropertyType, ListingType, ListingStatus, Inquiry, InquiryStatus, Testimonial };
