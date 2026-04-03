export const PROPERTY_TYPES = [
  { value: "APARTMENT", labelUk: "Квартира", labelEn: "Apartment" },
  { value: "HOUSE", labelUk: "Будинок", labelEn: "House" },
  { value: "COMMERCIAL", labelUk: "Комерція", labelEn: "Commercial" },
  { value: "LAND", labelUk: "Земля", labelEn: "Land" },
  { value: "OFFICE", labelUk: "Офіс", labelEn: "Office" },
] as const;

export const LISTING_TYPES = [
  { value: "SALE", labelUk: "Продаж", labelEn: "For Sale" },
  { value: "RENT", labelUk: "Оренда", labelEn: "For Rent" },
] as const;

export const CURRENCIES = ["UAH", "USD", "EUR"] as const;

export const DISTRICTS_IF = [
  { value: "center", labelUk: "Центр", labelEn: "Center" },
  { value: "pasichna", labelUk: "Пасічна", labelEn: "Pasichna" },
  { value: "bam", labelUk: "БАМ", labelEn: "BAM" },
  { value: "pozytron", labelUk: "Позитрон", labelEn: "Pozytron" },
  { value: "kalinivka", labelUk: "Калинівка", labelEn: "Kalinivka" },
  { value: "khimik", labelUk: "Хімік", labelEn: "Khimik" },
  { value: "nova_skvaryava", labelUk: "Нова Скварява", labelEn: "Nova Skvaryava" },
] as const;

export const PROPERTY_FEATURES = [
  { value: "parking", labelUk: "Паркінг", labelEn: "Parking", icon: "car" },
  { value: "balcony", labelUk: "Балкон", labelEn: "Balcony", icon: "building" },
  { value: "elevator", labelUk: "Ліфт", labelEn: "Elevator", icon: "arrow-up" },
  { value: "furniture", labelUk: "Меблі", labelEn: "Furnished", icon: "sofa" },
  { value: "appliances", labelUk: "Техніка", labelEn: "Appliances", icon: "tv" },
  { value: "security", labelUk: "Охорона", labelEn: "Security", icon: "shield" },
  { value: "garden", labelUk: "Сад", labelEn: "Garden", icon: "trees" },
  { value: "pool", labelUk: "Басейн", labelEn: "Pool", icon: "waves" },
  { value: "internet", labelUk: "Інтернет", labelEn: "Internet", icon: "wifi" },
  { value: "ac", labelUk: "Кондиціонер", labelEn: "Air Conditioning", icon: "thermometer" },
  { value: "new_building", labelUk: "Новобудова", labelEn: "New Building", icon: "building-2" },
  { value: "open_plan", labelUk: "Відкрите планування", labelEn: "Open Plan", icon: "layout" },
] as const;

export const SORT_OPTIONS = [
  { value: "createdAt_desc", labelUk: "Нові спочатку", labelEn: "Newest First" },
  { value: "price_asc", labelUk: "Ціна: зростання", labelEn: "Price: Low to High" },
  { value: "price_desc", labelUk: "Ціна: спадання", labelEn: "Price: High to Low" },
  { value: "areaSqm_desc", labelUk: "Площа: більша", labelEn: "Area: Largest First" },
] as const;

export const LOCALES = ["uk", "en"] as const;
export const DEFAULT_LOCALE = "uk";

export const COMPANY = {
  name: "Progress Estate",
  phone: "+380 67 123 45 67",
  email: "info@progressestate.com.ua",
  address: "м. Івано-Франківськ",
  instagram: "https://www.instagram.com/progress.estate.if/",
  facebook: "",
};

export const PAGE_SIZE = 12;
