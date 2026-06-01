// ЖК i dzielnice Івано-Франківськ — coords na podstawie lun.ua + Nominatim

export const JK_PATTERNS: { patterns: string[]; lat: number; lng: number; name: string }[] = [
  // ЖК z lun.ua
  { name: "Княгинин",          patterns: ["княгинин", "княгинен", "knyahynyn"], lat: 48.9362954, lng: 24.7093599 },
  { name: "Містечко Центральне", patterns: ["містечко центральне", "містечко-центральне"], lat: 48.9107, lng: 24.7209 },
  { name: "Manhattan Up",      patterns: ["manhattan up", "manhattan", "манхеттен"], lat: 48.9208, lng: 24.6867 },
  { name: "Family Plaza",      patterns: ["family plaza", "family park", "фемілі"], lat: 48.9336, lng: 24.7116 },
  { name: "UNION",             patterns: ["union", "юніон"], lat: 48.9135, lng: 24.7174 },
  { name: "Comfort House",     patterns: ["comfort house", "комфорт хаус"], lat: 48.9454, lng: 24.7055 },
  { name: "Комфорт парк",      patterns: ["комфорт парк", "comfort park"], lat: 48.9454, lng: 24.7055 },
  { name: "SKYGARDEN",         patterns: ["skygarden", "скайгарден", "sky garden", "скай гарден", "хрипленська"], lat: 48.9123, lng: 24.7295 },
  { name: "Козацький",         patterns: ["козацький"], lat: 48.9031, lng: 24.6885 },
  { name: "Галицький Двір",    patterns: ["галицький двір"], lat: 48.9314, lng: 24.7430 },
  { name: "Європейський Сіті", patterns: ["європейський сіті", "євро сіті", "european city", "євросіті"], lat: 48.9384, lng: 24.7509 },
  { name: "Паркова алея",      patterns: ["паркова алея"], lat: 48.9105, lng: 24.7499 },
  { name: "Паркове Містечко",  patterns: ["паркове містечко", "«паркове містечко»"], lat: 48.9160, lng: 24.7380 },
  { name: "Central Avenue",    patterns: ["central avenue", "централ авеню", "залізнична 13"], lat: 48.9192, lng: 24.7250 },
  { name: "U One",             patterns: ["u one", "uone", "ю ван", "uone"], lat: 48.9364, lng: 24.7268 },
  { name: "Містечко Соборне",  patterns: ["містечко соборне", "соборне", "калуське шосе"], lat: 48.9488, lng: 24.6872 },
  { name: "IQ House",          patterns: ["iq house"], lat: 48.9226, lng: 24.7111 },
  { name: "Молодіжний",        patterns: ["молодіжний"], lat: 48.9170, lng: 24.7050 },
  { name: "Шоколад",           patterns: ["шоколад"], lat: 48.9300, lng: 24.7150 },
  { name: "Ярко-Центр",        patterns: ["ярко-центр", "ярко центр", "ярко"], lat: 48.9204, lng: 24.6994 },
  { name: "Привокзальний",     patterns: ["привокзальний"], lat: 48.9204, lng: 24.6994 },
  { name: "Калинова Слобода",  patterns: ["калинова слобода", "дворова"], lat: 48.9150, lng: 24.7450 },
  { name: "HydroPark DeLuxe", patterns: ["hydropark", "гідропарк", "мазепи 142", "мазепи, 142"], lat: 48.9116, lng: 24.6917 },
  { name: "Prostir",           patterns: ["prostir", "простір"], lat: 48.9032, lng: 24.6983 },
  { name: "PORTO FRANKO",      patterns: ["porto franko", "порто франко"], lat: 48.9240, lng: 24.7110 },
  { name: "WAWEL",             patterns: ["wawel", "вавель"], lat: 48.9329, lng: 24.7501 },
  { name: "URBN",              patterns: ["urbn"], lat: 48.8888, lng: 24.6881 },
  { name: "ЛИПКИ 2",           patterns: ["липки 2", "липки"], lat: 48.9153, lng: 24.7316 },
  { name: "Comfort Park 2",    patterns: ["comfort park 2"], lat: 48.9109, lng: 24.7105 },
  { name: "NOVATOR",           patterns: ["novator", "новатор"], lat: 48.9033, lng: 24.6972 },
  { name: "Protezione",        patterns: ["protezione"], lat: 48.9160, lng: 24.7050 },
  { name: "Senat",             patterns: ["senat", "сенат"], lat: 48.9239, lng: 24.6945 },
  { name: "Green Side",        patterns: ["green side", "грін сайд"], lat: 48.9350, lng: 24.7450 },
  { name: "Акварелі",          patterns: ["акварелі"], lat: 48.9140, lng: 24.6960 },
  { name: "Гармонія",          patterns: ["гармонія"], lat: 48.9071, lng: 24.6821 },
  { name: "Millennium",        patterns: ["millennium", "мілленіум", "міленіум"], lat: 48.9180, lng: 24.7030 },
  { name: "PARK AVENUE",       patterns: ["park avenue"], lat: 48.9153, lng: 24.7316 },
  { name: "Містечко Молодіжне", patterns: ["містечко молодіжне"], lat: 48.9428, lng: 24.6961 },
  { name: "СКАНДИНАВІЯ",          patterns: ["скандинавія"], lat: 48.9380, lng: 24.7100 },
  { name: "Столичний Квартал",    patterns: ["столичний квартал"], lat: 48.9260, lng: 24.7150 },
  // Нові ЖК з lun.ua
  { name: "KASKAD-ЯРКО",          patterns: ["kaskad-ярко", "каскад ярко", "каскад-ярко"], lat: 48.9329, lng: 24.7501 },
  { name: "Опришівська Слобода",  patterns: ["опришівська слобода", "опришівці слобода"], lat: 48.8869, lng: 24.7151 },
  { name: "Житловий район Княгинин", patterns: ["житловий район княгинин", "жр княгинин"], lat: 48.9362, lng: 24.7094 },
  { name: "Афіни",                patterns: ["афіни", "afiny"], lat: 48.9207, lng: 24.6867 },
  { name: "Містечко Козацьке",    patterns: ["містечко козацьке"], lat: 48.9031, lng: 24.6885 },
  { name: "Provance Home",        patterns: ["provance home", "прованс хоум", "провансе"], lat: 48.9105, lng: 24.7499 },
  { name: "City Villa Club",      patterns: ["city villa club", "city villa"], lat: 48.9329, lng: 24.7501 },
  { name: "Містечко Затишне",     patterns: ["містечко затишне", "затишне"], lat: 48.9300, lng: 24.7200 },
  { name: "Central Town",         patterns: ["central town", "централ таун"], lat: 48.9180, lng: 24.6750 },
  { name: "Family Town",          patterns: ["family town", "фемілі таун"], lat: 48.8888, lng: 24.6881 },
  { name: "MonteLux",             patterns: ["montelux", "монтелюкс"], lat: 48.8888, lng: 24.6881 },
  { name: "River Yard",           patterns: ["river yard", "рівер ярд"], lat: 48.9300, lng: 24.7200 },
  { name: "BRAVE",                patterns: ["brave", "брейв"], lat: 48.9428, lng: 24.6961 },
  { name: "Smart House",          patterns: ["smart house", "смарт хаус"], lat: 48.8869, lng: 24.7151 },
  { name: "Perfect House",        patterns: ["perfect house", "перфект хаус"], lat: 48.9428, lng: 24.6961 },
  { name: "Квартал Галицький",    patterns: ["квартал галицький", "галицький квартал"], lat: 48.9240, lng: 24.7150 },
  { name: "Липські вежі",         patterns: ["липські вежі", "липські вежі"], lat: 48.9153, lng: 24.7316 },
  { name: "City",                 patterns: ["жк city", "жк сіті"], lat: 48.9190, lng: 24.6984 },
  { name: "PHOENIX PLAZA",        patterns: ["phoenix plaza", "фенікс плаза"], lat: 48.9350, lng: 24.7000 },
  { name: "Comfort Park",         patterns: ["comfort park", "комфорт парк"], lat: 48.9454, lng: 24.7055 },
  { name: "Family Plaza",         patterns: ["family plaza", "фемілі плаза"], lat: 48.9336, lng: 24.7116 },
  { name: "Коновальця",           patterns: ["коновальця", "жк коновальця"], lat: 48.9215, lng: 24.7200 },
  { name: "Mélis",                patterns: ["mélis", "меліс", "апарт-готель меліс"], lat: 48.9200, lng: 24.7100 },
  { name: "Рубін Апартамент",     patterns: ["рубін апартамент", "рубін", "rubin apart"], lat: 48.9220, lng: 24.7080 },
  { name: "RAIT HOUSE",           patterns: ["rait house", "рейт хаус", "rait"], lat: 48.9329, lng: 24.7501 },
  { name: "Гарантбуд",            patterns: ["гарантбуд", "жк гарантбуд"], lat: 48.9350, lng: 24.6950 },
];

// Координати районів (fallback якщо ЖК не знайдено)
export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Центр":               { lat: 48.9226, lng: 24.7111 },
  "Княгинин":            { lat: 48.9362, lng: 24.7094 },
  "Набережна":           { lat: 48.9207, lng: 24.6867 },
  "Набережна Княгинин":  { lat: 48.9336, lng: 24.7116 },
  "Пасічна":             { lat: 48.9428, lng: 24.6961 },
  "Вовчинець":           { lat: 48.9329, lng: 24.7501 },
  "Позитрон":            { lat: 48.9390, lng: 24.7342 },
  "Каскад":              { lat: 48.9384, lng: 24.7509 },
  "Бам":                 { lat: 48.9031, lng: 24.6885 },
  "Майзлі":              { lat: 48.9105, lng: 24.7499 },
  "Угорники":            { lat: 48.9300, lng: 24.7200 },
  "Чукалівка":           { lat: 48.9109, lng: 24.7105 },
  "Вокзал":              { lat: 48.9204, lng: 24.6994 },
  "Крихівці":            { lat: 48.8888, lng: 24.6881 },
  "Калинова Слобода":    { lat: 48.9150, lng: 24.7450 },
  "Будівельників":       { lat: 48.9239, lng: 24.6945 },
  "Микитинці":           { lat: 48.8869, lng: 24.7151 },
  "Опришівці":           { lat: 48.8869, lng: 24.7151 },
  "Парковий":            { lat: 48.9160, lng: 24.6950 },
  "Бельведер":           { lat: 48.9250, lng: 24.6800 },
  "Гірка":               { lat: 48.9180, lng: 24.6750 },
  "Рінь":                { lat: 48.9050, lng: 24.7050 },
  "Брати":               { lat: 48.9300, lng: 24.7350 },
  "Озеро":               { lat: 48.9410, lng: 24.7000 },
  "Новий світ":          { lat: 48.9260, lng: 24.7300 },
  "Залізничний":         { lat: 48.9204, lng: 24.6994 },
  "Патріот":             { lat: 48.9350, lng: 24.7000 },
  "Софіївка":            { lat: 48.9320, lng: 24.7280 },
  "Городок":             { lat: 48.9200, lng: 24.6850 },
};

// Дані ЖК для автозаповнення форми (район + вулиця + координати)
export const JK_DATA: { name: string; district: string; address: string; lat: number; lng: number }[] = [
  { name: "Калинова Слобода",    district: "Калинова Слобода", address: "вул. Дворова",         lat: 48.9150, lng: 24.7450 },
  { name: "SKYGARDEN",           district: "Бам",              address: "вул. Хрипленська",      lat: 48.9123, lng: 24.7295 },
  { name: "HydroPark DeLuxe",    district: "Бам",              address: "вул. Мазепи, 142",      lat: 48.9116, lng: 24.6917 },
  { name: "Manhattan Up",        district: "Набережна",        address: "вул. Набережна Незалежності", lat: 48.9208, lng: 24.6867 },
  { name: "Family Park",         district: "Княгинин",         address: "вул. Гетьмана Мазепи",  lat: 48.9336, lng: 24.7116 },
  { name: "Містечко Молодіжне",  district: "Пасічна",          address: "вул. Пасічна",           lat: 48.9428, lng: 24.6961 },
  { name: "Містечко Центральне", district: "Центр",            address: "вул. Тичини",            lat: 48.9107, lng: 24.7209 },
  { name: "Містечко Південне",   district: "Центр",            address: "вул. Тичини",            lat: 48.9107, lng: 24.7209 },
  { name: "Містечко Соборне",    district: "Пасічна",          address: "Калуське шосе",          lat: 48.9488, lng: 24.6872 },
  { name: "NOVATOR",             district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9033, lng: 24.6972 },
  { name: "Prostir",             district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9032, lng: 24.6983 },
  { name: "PORTO FRANKO",        district: "Центр",            address: "вул. Незалежності",      lat: 48.9240, lng: 24.7110 },
  { name: "WAWEL",               district: "Вовчинець",        address: "вул. Вовчинецька",       lat: 48.9329, lng: 24.7501 },
  { name: "URBN",                district: "Крихівці",         address: "вул. Крихівецька",       lat: 48.8888, lng: 24.6881 },
  { name: "ЛИПКИ 2",             district: "Рінь",             address: "вул. Липова",            lat: 48.9153, lng: 24.7316 },
  { name: "Comfort Park 2",      district: "Чукалівка",        address: "вул. Чукалівська",       lat: 48.9109, lng: 24.7105 },
  { name: "Senat",               district: "Будівельників",    address: "вул. Будівельників",     lat: 48.9239, lng: 24.6945 },
  { name: "Millennium",          district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9180, lng: 24.7030 },
  { name: "Millennium Elite",    district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9180, lng: 24.7030 },
  { name: "СКАНДИНАВІЯ",         district: "Княгинин",         address: "вул. Гетьмана Мазепи",   lat: 48.9380, lng: 24.7100 },
  { name: "Акварелі",            district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9140, lng: 24.6960 },
  { name: "Green Side",          district: "Вовчинець",        address: "вул. Вовчинецька",       lat: 48.9350, lng: 24.7450 },
  { name: "Столичний Квартал",   district: "Центр",            address: "вул. Незалежності",      lat: 48.9260, lng: 24.7150 },
  { name: "Гармонія",            district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9071, lng: 24.6821 },
  { name: "Protezione",          district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9160, lng: 24.7050 },
  { name: "PARK AVENUE premium", district: "Рінь",             address: "вул. Липова",            lat: 48.9153, lng: 24.7316 },
  { name: "Паркове містечко",    district: "Майзлі",           address: "вул. Паркова",           lat: 48.9160, lng: 24.7380 },
  { name: "Паркова Оселя",       district: "Парковий",         address: "вул. Паркова",           lat: 48.9160, lng: 24.6950 },
  { name: "Парковий квартал",    district: "Парковий",         address: "вул. Паркова",           lat: 48.9160, lng: 24.6950 },
  { name: "Атріум",              district: "Центр",            address: "вул. Незалежності",      lat: 48.9226, lng: 24.7111 },
  { name: "Галицький Квартал",   district: "Центр",            address: "вул. Галицька",          lat: 48.9240, lng: 24.7150 },
  { name: "Panorama",            district: "Центр",            address: "вул. Незалежності",      lat: 48.9200, lng: 24.7100 },
  { name: "Central Park",        district: "Центр",            address: "вул. Незалежності",      lat: 48.9226, lng: 24.7111 },
  { name: "IQ House",            district: "Центр",            address: "вул. Незалежності",      lat: 48.9226, lng: 24.7111 },
  { name: "U One",               district: "Позитрон",         address: "вул. Позитронна",        lat: 48.9364, lng: 24.7268 },
  { name: "Новий світ",          district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9260, lng: 24.7300 },
  { name: "Патріот",             district: "Каскад",           address: "вул. Каскадна",          lat: 48.9350, lng: 24.7000 },
  { name: "Діброва Парк",        district: "Пасічна",          address: "вул. Пасічна",           lat: 48.9390, lng: 24.6900 },
  { name: "ESCAPE City",         district: "Центр",            address: "вул. Незалежності",      lat: 48.9226, lng: 24.7111 },
  { name: "Lipky 2",             district: "Рінь",             address: "вул. Липова",            lat: 48.9153, lng: 24.7316 },
  { name: "Skogur City",         district: "Бам",              address: "вул. Гетьмана Мазепи",   lat: 48.9033, lng: 24.6972 },
  { name: "СВІТАНОК",            district: "Пасічна",          address: "вул. Пасічна",           lat: 48.9390, lng: 24.7050 },
  { name: "Ренесанс",            district: "Центр",            address: "вул. Незалежності",      lat: 48.9220, lng: 24.7100 },
  { name: "Smart House",         district: "Центр",            address: "вул. Незалежності",      lat: 48.9220, lng: 24.7100 },
  { name: "Вілла Флоренція",     district: "Вовчинець",        address: "вул. Вовчинецька",       lat: 48.9320, lng: 24.7480 },
  { name: "Авалон",              district: "Пасічна",          address: "вул. Пасічна",           lat: 48.9390, lng: 24.6930 },
  { name: "Greenville Park",     district: "Пасічна",          address: "вул. Пасічна",           lat: 48.9390, lng: 24.6930 },
  { name: "Ізумрудний",          district: "Каскад",           address: "вул. Вовчинецька",       lat: 48.9350, lng: 24.7480 },
  // Нові ЖК з lun.ua
  { name: "KASKAD-ЯРКО",          district: "Вовчинець",        address: "вул. Вовчинецька",        lat: 48.9329, lng: 24.7501 },
  { name: "Опришівська Слобода",  district: "Опришівці",        address: "вул. Опришівська",        lat: 48.8869, lng: 24.7151 },
  { name: "Афіни",                district: "Набережна",        address: "вул. Набережна Незалежності", lat: 48.9207, lng: 24.6867 },
  { name: "Містечко Козацьке",    district: "Бам",              address: "вул. Гетьмана Мазепи",    lat: 48.9031, lng: 24.6885 },
  { name: "Provance Home",        district: "Майзлі",           address: "вул. Майзлівська",        lat: 48.9105, lng: 24.7499 },
  { name: "City Villa Club",      district: "Вовчинець",        address: "вул. Вовчинецька",        lat: 48.9329, lng: 24.7501 },
  { name: "Містечко Затишне",     district: "Угорники",         address: "вул. Угорницька",         lat: 48.9300, lng: 24.7200 },
  { name: "Central Town",         district: "Гірка",            address: "вул. Гірська",            lat: 48.9180, lng: 24.6750 },
  { name: "Family Town",          district: "Крихівці",         address: "вул. Крихівецька",        lat: 48.8888, lng: 24.6881 },
  { name: "MonteLux",             district: "Крихівці",         address: "вул. Крихівецька",        lat: 48.8888, lng: 24.6881 },
  { name: "River Yard",           district: "Угорники",         address: "вул. Угорницька",         lat: 48.9300, lng: 24.7200 },
  { name: "BRAVE",                district: "Пасічна",          address: "вул. Пасічна",            lat: 48.9428, lng: 24.6961 },
  { name: "Perfect House",        district: "Пасічна",          address: "вул. Пасічна",            lat: 48.9390, lng: 24.6950 },
  { name: "Квартал Галицький",    district: "Пасічна",          address: "вул. Пасічна",            lat: 48.9420, lng: 24.6980 },
  { name: "Липські вежі",         district: "Рінь",             address: "вул. Липова",             lat: 48.9153, lng: 24.7316 },
  { name: "City",                 district: "Арсенал",          address: "вул. Арсенальна",         lat: 48.9190, lng: 24.6984 },
  { name: "PHOENIX PLAZA",        district: "Патріот",          address: "вул. Патріотів",          lat: 48.9350, lng: 24.7000 },
  { name: "Comfort Park",         district: "Пасічна",          address: "вул. Пасічна",            lat: 48.9454, lng: 24.7055 },
  { name: "Family Plaza",         district: "Княгинин",         address: "вул. Гетьмана Мазепи",    lat: 48.9336, lng: 24.7116 },
  { name: "Житловий район Княгинин", district: "Княгинин",      address: "вул. Гетьмана Мазепи",    lat: 48.9362, lng: 24.7094 },
  { name: "Коновальця",            district: "Центр",           address: "вул. Коновальця",          lat: 48.9215, lng: 24.7200 },
  { name: "Mélis",                 district: "Центр",           address: "вул. Незалежності",        lat: 48.9200, lng: 24.7100 },
  { name: "Рубін Апартамент",      district: "Центр",           address: "вул. Незалежності",        lat: 48.9220, lng: 24.7080 },
  { name: "RAIT HOUSE",            district: "Вовчинець",       address: "вул. Вовчинецька",         lat: 48.9329, lng: 24.7501 },
  { name: "Гарантбуд",             district: "Пасічна",         address: "вул. Пасічна",             lat: 48.9350, lng: 24.6950 },
];

// Функція: знайти координати по тексту назви/адреси/району
export function inferCoords(
  titleUk: string,
  address: string | null,
  district: string | null
): { lat: number; lng: number; source: "jk" | "district" | null; sourceName?: string } {
  const text = `${titleUk} ${address ?? ""}`.toLowerCase();

  // 1. Спочатку витягнути назву після «ЖК» і шукати її окремо
  const jkMatch = text.match(/жк\s+[«"']?([^,\n·|!?]+?)[«"']?\s*(?:бізнес|клас|готов|будів|збудов|секц|поверх|центр|–|-|$)/);
  if (jkMatch) {
    const extracted = jkMatch[1].trim();
    for (const jk of JK_PATTERNS) {
      if (jk.patterns.some((p) => extracted.includes(p) || p.includes(extracted.split(" ")[0]))) {
        return { lat: jk.lat, lng: jk.lng, source: "jk", sourceName: jk.name };
      }
    }
  }

  // 2. Повний текст — шукаємо будь-який патерн
  for (const jk of JK_PATTERNS) {
    if (jk.patterns.some((p) => text.includes(p))) {
      return { lat: jk.lat, lng: jk.lng, source: "jk", sourceName: jk.name };
    }
  }

  // 3. Fallback на район
  if (district) {
    const d = DISTRICT_COORDS[district];
    if (d) return { lat: d.lat, lng: d.lng, source: "district", sourceName: district };
  }

  return { lat: 0, lng: 0, source: null };
}
