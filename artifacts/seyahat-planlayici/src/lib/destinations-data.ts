export interface PresetCountry {
  name: string;
  code: string;
  flag: string;
  popularCities: string[];
}

export const PRESET_COUNTRIES: PresetCountry[] = [
  {
    name: 'Kuzey Makedonya',
    code: 'MK',
    flag: '🇲🇰',
    popularCities: ['Üsküp', 'Ohri', 'Bitola', 'Kalkandelen', 'Mavrovo'],
  },
  {
    name: 'Karadağ',
    code: 'ME',
    flag: '🇲🇪',
    popularCities: ['Kotor', 'Budva', 'Cetinje', 'Bar', 'Podgorica', 'Tivat', 'Perast', 'Žabljak'],
  },
  {
    name: 'Sırbistan',
    code: 'RS',
    flag: '🇷🇸',
    popularCities: ['Belgrad', 'Novi Sad', 'Niş', 'Subotica', 'Zlatibor'],
  },
  {
    name: 'Bosna-Hersek',
    code: 'BA',
    flag: '🇧🇦',
    popularCities: ['Saraybosna', 'Mostar', 'Travnik', 'Trebinje', 'Konjic', 'Blagaj'],
  },
  {
    name: 'Arnavutluk',
    code: 'AL',
    flag: '🇦🇱',
    popularCities: ['Tiran', 'Berat', 'Saranda', 'Gjirokastër', 'İşkodra', 'Ksamil'],
  },
  {
    name: 'Yunanistan',
    code: 'GR',
    flag: '🇬🇷',
    popularCities: ['Atina', 'Selanik', 'Meteora', 'Santorini', 'Hanya', 'Rodos'],
  },
  {
    name: 'İtalya',
    code: 'IT',
    flag: '🇮🇹',
    popularCities: ['Roma', 'Floransa', 'Venedik', 'Milano', 'Napoli', 'Bologna'],
  },
  {
    name: 'İspanya',
    code: 'ES',
    flag: '🇪🇸',
    popularCities: ['Barselona', 'Madrid', 'Sevilla', 'Valensiya', 'Granada'],
  },
  {
    name: 'Fransa',
    code: 'FR',
    flag: '🇫🇷',
    popularCities: ['Paris', 'Nice', 'Lyon', 'Marsilya', 'Bordeaux'],
  },
  {
    name: 'Almanya',
    code: 'DE',
    flag: '🇩🇪',
    popularCities: ['Berlin', 'Münih', 'Hamburg', 'Köln', 'Frankfurt'],
  },
  {
    name: 'Avusturya',
    code: 'AT',
    flag: '🇦🇹',
    popularCities: ['Viyana', 'Salzburg', 'Hallstatt', 'Innsbruck', 'Graz'],
  },
  {
    name: 'Macaristan',
    code: 'HU',
    flag: '🇭🇺',
    popularCities: ['Budapeşte', 'Debrecen', 'Szeged', 'Eger', 'Pécs'],
  },
  {
    name: 'Çekya',
    code: 'CZ',
    flag: '🇨🇿',
    popularCities: ['Prag', 'Cesky Krumlov', 'Karlovy Vary', 'Brno'],
  },
  {
    name: 'Hollanda',
    code: 'NL',
    flag: '🇳🇱',
    popularCities: ['Amsterdam', 'Rotterdam', 'Utrecht', 'Lahey'],
  },
  {
    name: 'Portekiz',
    code: 'PT',
    flag: '🇵🇹',
    popularCities: ['Lizbon', 'Porto', 'Sintra', 'Faro', 'Cascais'],
  },
  {
    name: 'Hırvatistan',
    code: 'HR',
    flag: '🇭🇷',
    popularCities: ['Dubrovnik', 'Split', 'Zagreb', 'Zadar', 'Rovinj'],
  },
  {
    name: 'Türkiye',
    code: 'TR',
    flag: '🇹🇷',
    popularCities: ['İstanbul', 'Kapadokya', 'İzmir', 'Antalya', 'Kaş', 'Bursa'],
  },
  {
    name: 'Gürcistan',
    code: 'GE',
    flag: '🇬🇪',
    popularCities: ['Tiflis', 'Batum', 'Kazbegi', 'Sighnaghi', 'Kutaisi'],
  },
  {
    name: 'Japonya',
    code: 'JP',
    flag: '🇯🇵',
    popularCities: ['Tokyo', 'Kyoto', 'Osaka', 'Nara', 'Hiroşima'],
  },
  {
    name: 'Birleşik Krallık',
    code: 'GB',
    flag: '🇬🇧',
    popularCities: ['Londra', 'Edinburgh', 'Manchester', 'Oxford', 'Bath'],
  },
];

export function normalizeText(text: string): string {
  return text.trim().toLocaleLowerCase('tr-TR');
}

export function getCountryPreset(countryName: string): PresetCountry | undefined {
  const norm = normalizeText(countryName);
  return PRESET_COUNTRIES.find((c) => {
    const cNorm = normalizeText(c.name);
    return cNorm === norm || cNorm.includes(norm) || norm.includes(cNorm);
  });
}

export function getCountryFlag(countryName: string): string {
  const preset = getCountryPreset(countryName);
  if (preset) return preset.flag;
  return '📍';
}

export function getPopularCitiesForCountry(countryName: string): string[] {
  const preset = getCountryPreset(countryName);
  return preset ? preset.popularCities : [];
}
