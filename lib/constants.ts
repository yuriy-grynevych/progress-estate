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
  { value: "Центр",               labelUk: "Центр",               labelEn: "Center" },
  { value: "Княгинин",            labelUk: "Княгинин",            labelEn: "Knyahynyn" },
  { value: "Пасічна",             labelUk: "Пасічна",             labelEn: "Pasichna" },
  { value: "Набережна",           labelUk: "Набережна",           labelEn: "Naberezhna" },
  { value: "Каскад",              labelUk: "Каскад",              labelEn: "Kaskad" },
  { value: "Бам",                 labelUk: "БАМ",                 labelEn: "BAM" },
  { value: "Угорники",            labelUk: "Угорники",            labelEn: "Uhornyki" },
  { value: "Вовчинець",           labelUk: "Вовчинець",           labelEn: "Vovchynets" },
  { value: "Позитрон",            labelUk: "Позитрон",            labelEn: "Pozytron" },
  { value: "Опришівці",           labelUk: "Опришівці",           labelEn: "Opryshivtsi" },
  { value: "Набережна Княгинин",  labelUk: "Набережна Княгинин",  labelEn: "Naberezhna Knyahynyn" },
  { value: "Брати",               labelUk: "Брати",               labelEn: "Braty" },
  { value: "Майзлі",              labelUk: "Майзлі",              labelEn: "Maizli" },
  { value: "Вокзал",              labelUk: "Вокзал",              labelEn: "Railway station" },
  { value: "Гірка",               labelUk: "Гірка",               labelEn: "Hirka" },
  { value: "Рінь",                labelUk: "Рінь",                labelEn: "Rin" },
  { value: "Будівельників",       labelUk: "Будівельників",       labelEn: "Budivelnykiv" },
  { value: "Микитинці",           labelUk: "Микитинці",           labelEn: "Mykytyntsi" },
  { value: "Чукалівка",           labelUk: "Чукалівка",           labelEn: "Chukalivka" },
  { value: "Калинова Слобода",    labelUk: "Калинова Слобода",    labelEn: "Kalynova Sloboda" },
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
  name: "Житлова компанія Progress",
  phone: "+380 67 123 45 67",
  email: "info@progressestate.com.ua",
  address: "м. Івано-Франківськ",
  instagram: "https://www.instagram.com/progress.estate.if/",
  facebook: "",
};

export const PAGE_SIZE = 12;
