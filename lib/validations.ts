import { z } from "zod";

export const propertySchema = z.object({
  titleUk: z.string().min(3, "Мінімум 3 символи").max(200),
  titleEn: z.string().min(3, "Minimum 3 characters").max(200),
  descriptionUk: z.string().default(""),
  descriptionEn: z.string().default(""),
  type: z.enum(["APARTMENT", "HOUSE", "COMMERCIAL", "LAND", "OFFICE"]),
  listingType: z.enum(["SALE", "RENT"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RENTED"]).default("ACTIVE"),
  price: z.coerce.number().positive("Вкажіть ціну"),
  currency: z.string().default("UAH"),
  areaSqm: z.coerce.number().positive("Вкажіть площу"),
  landAreaSqm: z.coerce.number().optional().nullable(),
  rooms: z.coerce.number().int().optional().nullable(),
  bedrooms: z.coerce.number().int().optional().nullable(),
  bathrooms: z.coerce.number().int().optional().nullable(),
  floor: z.coerce.number().int().optional().nullable(),
  totalFloors: z.coerce.number().int().optional().nullable(),
  yearBuilt: z.coerce.number().int().min(1900).max(2030).optional().nullable(),
  kitchenSqm: z.coerce.number().optional().nullable(),
  gasType: z.string().optional().nullable(),
  renovationType: z.string().optional().nullable(),
  wallType: z.string().optional().nullable(),
  houseNumber: z.string().optional().nullable(),
  city: z.string().default("Івано-Франківськ"),
  district: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  features: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
});

export const inquirySchema = z.object({
  name: z.string().min(2, "Вкажіть ім'я"),
  email: z.string().email("Невірний email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Мінімум 10 символів"),
  propertyId: z.string().optional(),
  referredByUserId: z.string().optional(),
});

export const testimonialSchema = z.object({
  authorName: z.string().min(2),
  authorRole: z.string().optional(),
  contentUk: z.string().min(10),
  contentEn: z.string().min(10),
  rating: z.number().int().min(1).max(5).default(5),
  isPublished: z.boolean().default(false),
  order: z.number().int().default(0),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
export type InquiryFormValues = z.infer<typeof inquirySchema>;
export type TestimonialFormValues = z.infer<typeof testimonialSchema>;
