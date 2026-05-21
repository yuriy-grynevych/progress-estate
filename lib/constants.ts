export const PROPERTY_CATEGORIES = [
  { value: "RESIDENTIAL", labelUk: "Житлова нерухомість" },
  { value: "COMMERCIAL",  labelUk: "Комерційна нерухомість" },
  { value: "LAND",        labelUk: "Земельні ділянки" },
] as const;

export const PROPERTY_TYPES = [
  // Житлова
  { value: "APARTMENT",         labelUk: "Квартира",                 labelEn: "Apartment",          category: "RESIDENTIAL" },
  { value: "ROOM",              labelUk: "Кімната",                  labelEn: "Room",                category: "RESIDENTIAL" },
  { value: "HOUSE",             labelUk: "Будинок",                  labelEn: "House",               category: "RESIDENTIAL" },
  { value: "APARTMENT_PREMIUM", labelUk: "Апартаменти",              labelEn: "Apartments",          category: "RESIDENTIAL" },
  { value: "VILLA",             labelUk: "Вілла",                    labelEn: "Villa",               category: "RESIDENTIAL" },
  { value: "PENTHOUSE",         labelUk: "Пентхаус",                 labelEn: "Penthouse",           category: "RESIDENTIAL" },
  { value: "TOWNHOUSE",         labelUk: "Таунхаус",                 labelEn: "Townhouse",           category: "RESIDENTIAL" },
  { value: "DUPLEX",            labelUk: "Дуплекс",                  labelEn: "Duplex",              category: "RESIDENTIAL" },
  // Комерційна
  { value: "OFFICE",            labelUk: "Офіс",                     labelEn: "Office",              category: "COMMERCIAL" },
  { value: "RETAIL",            labelUk: "Торгівельна площа",        labelEn: "Retail",              category: "COMMERCIAL" },
  { value: "WAREHOUSE",         labelUk: "Складське приміщення",     labelEn: "Warehouse",           category: "COMMERCIAL" },
  { value: "INDUSTRIAL",        labelUk: "Виробниче приміщення",     labelEn: "Industrial",          category: "COMMERCIAL" },
  { value: "FOOD_SERVICE",      labelUk: "Об'єкт харчування",        labelEn: "Food Service",        category: "COMMERCIAL" },
  { value: "SERVICE_OBJECT",    labelUk: "Об'єкт послуг",            labelEn: "Service Object",      category: "COMMERCIAL" },
  { value: "SHOP",              labelUk: "Магазин",                  labelEn: "Shop",                category: "COMMERCIAL" },
  { value: "HOTEL_ROOM",        labelUk: "Готельний номер",          labelEn: "Hotel Room",          category: "COMMERCIAL" },
  { value: "WHOLE_BUILDING",    labelUk: "Ціла будівля",             labelEn: "Whole Building",      category: "COMMERCIAL" },
  { value: "COMMERCIAL",        labelUk: "Комерція (інше)",          labelEn: "Commercial",          category: "COMMERCIAL" },
  { value: "GARAGE",            labelUk: "Гараж",                    labelEn: "Garage",              category: "COMMERCIAL" },
  { value: "PARKING",           labelUk: "Паркування",               labelEn: "Parking",             category: "COMMERCIAL" },
  // Земельні
  { value: "LAND",              labelUk: "Земельна ділянка",         labelEn: "Land",                category: "LAND" },
  { value: "LAND_INDIVIDUAL",   labelUk: "Земля (інд. будівництво)", labelEn: "Land (Individual)",   category: "LAND" },
  { value: "LAND_GARDEN",       labelUk: "Земля (сад/город)",        labelEn: "Land (Garden)",       category: "LAND" },
  { value: "LAND_FARM",         labelUk: "Земля (сільгосп)",         labelEn: "Land (Farm)",         category: "LAND" },
  { value: "LAND_COMMERCIAL",   labelUk: "Земля (комерційна)",       labelEn: "Land (Commercial)",   category: "LAND" },
] as const;

export const LISTING_TYPES = [
  { value: "SALE",       labelUk: "Продаж",   labelEn: "For Sale" },
  { value: "RENT",       labelUk: "Оренда",   labelEn: "For Rent" },
  { value: "DAILY_RENT", labelUk: "Подобово", labelEn: "Daily Rent" },
] as const;

export const SOURCE_OPTIONS = [
  "OLX", "LUN.ua", "Dom.ria", "Facebook", "Instagram",
  "Рекомендація", "Власна база", "Дзвінок", "Офіс", "Інше",
] as const;

export const COMMISSION_TYPES = [
  { value: "FIXED",   labelUk: "Фіксована" },
  { value: "PERCENT", labelUk: "Відсоток %" },
] as const;

export const CURRENCIES = ["UAH", "USD", "EUR"] as const;

export const DISTRICTS_IF = [
  { value: "Центр",               labelUk: "Центр",               labelEn: "Center" },
  { value: "Княгинин",            labelUk: "Княгинин",            labelEn: "Knyahynyn" },
  { value: "Пасічна",             labelUk: "Пасічна",             labelEn: "Pasichna" },
  { value: "Набережна",           labelUk: "Набережна",           labelEn: "Naberezhna" },
  { value: "Набережна Княгинин",  labelUk: "Набережна Княгинин",  labelEn: "Naberezhna Knyahynyn" },
  { value: "Каскад",              labelUk: "Каскад",              labelEn: "Kaskad" },
  { value: "Бам",                 labelUk: "БАМ",                 labelEn: "BAM" },
  { value: "Угорники",            labelUk: "Угорники",            labelEn: "Uhornyki" },
  { value: "Вовчинець",           labelUk: "Вовчинець",           labelEn: "Vovchynets" },
  { value: "Позитрон",            labelUk: "Позитрон",            labelEn: "Pozytron" },
  { value: "Опришівці",           labelUk: "Опришівці",           labelEn: "Opryshivtsi" },
  { value: "Брати",               labelUk: "Брати",               labelEn: "Braty" },
  { value: "Майзлі",              labelUk: "Майзлі",              labelEn: "Maizli" },
  { value: "Вокзал",              labelUk: "Вокзал",              labelEn: "Railway station" },
  { value: "Гірка",               labelUk: "Гірка",               labelEn: "Hirka" },
  { value: "Рінь",                labelUk: "Рінь",                labelEn: "Rin" },
  { value: "Будівельників",       labelUk: "Будівельників",       labelEn: "Budivelnykiv" },
  { value: "Микитинці",           labelUk: "Микитинці",           labelEn: "Mykytyntsi" },
  { value: "Чукалівка",           labelUk: "Чукалівка",           labelEn: "Chukalivka" },
  { value: "Калинова Слобода",    labelUk: "Калинова Слобода",    labelEn: "Kalynova Sloboda" },
  { value: "Озеро",               labelUk: "Озеро",               labelEn: "Ozero" },
  { value: "Парковий",            labelUk: "Парковий",            labelEn: "Parkovy" },
  { value: "Бельведер",           labelUk: "Бельведер",           labelEn: "Belveder" },
  { value: "Новий світ",          labelUk: "Новий світ",          labelEn: "Novyi Svit" },
  { value: "Залізничний",         labelUk: "Залізничний",         labelEn: "Zaliznychnyi" },
  { value: "Південний бульвар",   labelUk: "Південний бульвар",   labelEn: "Southern Boulevard" },
  { value: "Північний бульвар",   labelUk: "Північний бульвар",   labelEn: "Northern Boulevard" },
  { value: "Кішлак",              labelUk: "Кішлак",              labelEn: "Kishlak" },
  { value: "Патріот",             labelUk: "Патріот",             labelEn: "Patriot" },
  { value: "Софіївка",            labelUk: "Софіївка",            labelEn: "Sofiivka" },
  { value: "Городок",             labelUk: "Городок",             labelEn: "Horodok" },
  { value: "Кант",                labelUk: "Кант",                labelEn: "Kant" },
  { value: "Крихівці",            labelUk: "Крихівці",            labelEn: "Krykivtsi" },
  { value: "Нім. колонія",        labelUk: "Нім. колонія",        labelEn: "German Colony" },
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

export const RESIDENTIAL_COMPLEXES_IF = [
  // Актуальні ЖК з lun.ua (Івано-Франківськ)
  "Акварелі",
  "Central Park",
  "City",
  "Comfort Park 2",
  "Діброва Парк",
  "Долішній",
  "ESCAPE City",
  "Family Park",
  "Гармонія",
  "Green Side",
  "HydroPark DeLuxe",
  "Лазенський Дім",
  "Липські вежі",
  "ЛИПКИ 2",
  "Manhattan Up",
  "Millennium",
  "Millennium Elite",
  "Містечко Молодіжне",
  "Містечко Південне",
  "Містечко Центральне",
  "NOVATOR",
  "PARK AVENUE premium",
  "Паркове містечко",
  "Парковий",
  "PORTO FRANKO",
  "Protezione",
  "Prostir",
  "Senat",
  "СКАНДИНАВІЯ",
  "SKYGARDEN",
  "Skogur City",
  "Столичний Квартал",
  "СВІТАНОК",
  "URBN",
  "WAWEL",
  "WOL. Home. Karpaty",
  "Центральний",
  // Старі / ще актуальні
  "Атріум",
  "Авалон",
  "Галицький Квартал",
  "Greenville Park",
  "Ізумрудний",
  "Panorama",
  "Паркова Оселя",
  "Парковий квартал",
  "Ренесанс",
  "Smart House",
  "Вілла Флоренція",
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
