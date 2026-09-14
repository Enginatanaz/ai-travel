import { useMemo, useState, type FormEvent } from 'react';
import type { TravelPlan, CountryPlanItem } from '@workspace/api-client-react';
import { TravelPlanResult } from '@/components/travel-plan-result';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BedDouble,
  Bike,
  BusFront,
  CalendarDays,
  CarFront,
  CarTaxiFront,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Compass,
  Footprints,
  Heart,
  Info,
  MapPin,
  Moon,
  Navigation,
  Plane,
  Plus,
  Route,
  Sparkles,
  SunMedium,
  TrainFront,
  Trash2,
  Users,
  WalletCards,
  Wand2,
  X,
} from 'lucide-react';
import {
  getCountryFlag,
  getPopularCitiesForCountry,
  PRESET_COUNTRIES,
} from '@/lib/destinations-data';

type Option = { value: string; label: string; note?: string };
type Preferences = {
  travelers: string;
  accommodation: string;
  startTime: string;
  endTime: string;
  walking: string;
};

interface CountryState {
  id: string;
  country: string;
  code?: string;
  order: number;
  days: number;
  cities: string[];
}

const interestsList: Option[] = [
  { value: 'kultur', label: 'Kültür & Tarih' },
  { value: 'yemek', label: 'Gastronomi & Yerel Lezzetler' },
  { value: 'doga', label: 'Doğa & Manzara' },
  { value: 'deniz', label: 'Deniz & Sahil' },
  { value: 'sanat', label: 'Sanat & Tasarım' },
  { value: 'kafeler', label: 'Kafeler & Şehir Havası' },
];

const budgets: Option[] = [
  { value: 'ekonomik', label: 'Ekonomik', note: 'Temel konfor, akıllı seçimler' },
  { value: 'dengeli', label: 'Dengeli', note: 'Konfor ve keşif arasında' },
  { value: 'rahat', label: 'Rahat', note: 'Daha fazla esneklik ve lüks' },
];

const transportOptions = [
  { value: 'Araba', label: 'Araba', note: 'Özgür rota & esnek duraklar', icon: <CarFront size={18} /> },
  { value: 'Tren', label: 'Tren', note: 'Manzaralı ve konforlu hatlar', icon: <TrainFront size={18} /> },
  { value: 'Otobüs', label: 'Otobüs', note: 'Ekonomik ve yaygın ağ', icon: <BusFront size={18} /> },
  { value: 'Uçak', label: 'Uçak', note: 'Hızlı uzun mesafe geçiş', icon: <Plane size={18} /> },
  { value: 'Yürüyüş', label: 'Yürüyüş', note: 'Şehri adım adım keşfet', icon: <Footprints size={18} /> },
  { value: 'Bisiklet', label: 'Bisiklet', note: 'Aktif ve yerel tempo', icon: <Bike size={18} /> },
  { value: 'Taksi / Şehir İçi', label: 'Taksi & Şehir İçi', note: 'Hızlı şehir içi intikaller', icon: <CarTaxiFront size={18} /> },
];

const initialPreferences: Preferences = {
  travelers: '2',
  accommodation: '',
  startTime: '09:00',
  endTime: '22:00',
  walking: 'orta',
};

function Logo() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      <div className="relative flex size-10 items-center justify-center rounded-[13px] bg-[#f5cf55] text-[#164b4a] shadow-[4px_4px_0_#164b4a]">
        <Compass size={22} strokeWidth={2.4} />
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#d66f4e]" />
      </div>
      <div className="leading-none">
        <div className="font-display text-[20px] font-bold tracking-[-0.05em] text-[#164b4a]">yolüstü</div>
        <div className="mt-1 font-mono-ui text-[8px] uppercase tracking-[0.22em] text-[#64817a]">akıllı seyahat haritası</div>
      </div>
    </div>
  );
}

function SectionHeading({
  number,
  eyebrow,
  title,
  hint,
}: {
  number: string;
  eyebrow: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-6 flex gap-4">
      <div className="font-mono-ui pt-1 text-[11px] font-medium tracking-[0.16em] text-[#d66f4e]">{number}</div>
      <div>
        <div className="mb-1 font-mono-ui text-[10px] font-medium uppercase tracking-[0.16em] text-[#64817a]">{eyebrow}</div>
        <h2 className="font-display text-[22px] font-bold tracking-[-0.035em] text-[#164b4a]">{title}</h2>
        {hint && <p className="mt-1 text-[13px] leading-5 text-[#6a817c]">{hint}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-2 flex items-center gap-1 text-[12px] font-semibold text-[#365957]">
      {children}
      {required && <span className="text-[#d66f4e]">*</span>}
    </div>
  );
}

function Home() {
  const [countries, setCountries] = useState<CountryState[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const [cityInputs, setCityInputs] = useState<Record<string, string>>({});

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['kultur']);
  const [budget, setBudget] = useState('dengeli');
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>(['Araba', 'Yürüyüş']);

  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [showPreferences, setShowPreferences] = useState(false);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [requestError, setRequestError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Total trip days calculation
  const totalTripDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T12:00:00`).getTime();
    const end = new Date(`${endDate}T12:00:00`).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  // Sum of days allocated to countries
  const totalAllocatedDays = useMemo(() => {
    return countries.reduce((sum, c) => sum + c.days, 0);
  }, [countries]);

  const daysDifference = totalTripDays > 0 ? totalTripDays - totalAllocatedDays : 0;

  // Add country
  const addCountry = (nameToAdd?: string) => {
    const name = (nameToAdd || countryInput).trim();
    if (!name) return;

    if (countries.some((c) => c.country.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'))) {
      setCountryInput('');
      return;
    }

    const popular = getPopularCitiesForCountry(name);
    // Initial days allocation: share available days or default to 3
    const remainingDays = Math.max(1, daysDifference);
    const initialDays = totalTripDays > 0 ? Math.min(3, remainingDays) : 3;

    // By default preselect top 2-3 popular cities if available
    const initialCities = popular.slice(0, 3);

    const newCountry: CountryState = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      country: name,
      order: countries.length + 1,
      days: initialDays,
      cities: initialCities,
    };

    setCountries((prev) => [...prev, newCountry]);
    setCountryInput('');
  };

  const removeCountry = (id: string) => {
    setCountries((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, order: idx + 1 }))
    );
  };

  const moveCountry = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === countries.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...countries];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    setCountries(reordered.map((c, idx) => ({ ...c, order: idx + 1 })));
  };

  const updateCountryDays = (id: string, delta: number) => {
    setCountries((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newDays = Math.max(1, c.days + delta);
        return { ...c, days: newDays };
      })
    );
  };

  const toggleCityInCountry = (countryId: string, city: string) => {
    setCountries((prev) =>
      prev.map((c) => {
        if (c.id !== countryId) return c;
        const exists = c.cities.includes(city);
        const newCities = exists ? c.cities.filter((x) => x !== city) : [...c.cities, city];
        return { ...c, cities: newCities };
      })
    );
  };

  const moveCityInCountry = (countryId: string, cityIndex: number, direction: 'up' | 'down') => {
    setCountries((prev) =>
      prev.map((c) => {
        if (c.id !== countryId) return c;
        const targetIndex = direction === 'up' ? cityIndex - 1 : cityIndex + 1;
        if (targetIndex < 0 || targetIndex >= c.cities.length) return c;
        const updated = [...c.cities];
        const [moved] = updated.splice(cityIndex, 1);
        updated.splice(targetIndex, 0, moved);
        return { ...c, cities: updated };
      })
    );
  };

  const addCustomCity = (countryId: string) => {
    const raw = (cityInputs[countryId] || '').trim();
    if (!raw) return;

    setCountries((prev) =>
      prev.map((c) => {
        if (c.id !== countryId) return c;
        if (c.cities.some((item) => item.toLocaleLowerCase('tr-TR') === raw.toLocaleLowerCase('tr-TR'))) {
          return c;
        }
        return { ...c, cities: [...c.cities, raw] };
      })
    );

    setCityInputs((prev) => ({ ...prev, [countryId]: '' }));
  };

  // Auto-distribute days among countries
  const handleAutoDistribute = () => {
    if (countries.length === 0) return;
    const targetDays = totalTripDays > 0 ? totalTripDays : countries.length * 3;
    const count = countries.length;
    const baseDays = Math.floor(targetDays / count);
    const remainder = targetDays % count;

    setCountries((prev) =>
      prev.map((c, idx) => ({
        ...c,
        days: Math.max(1, baseDays + (idx < remainder ? 1 : 0)),
      }))
    );
  };

  const toggleInterest = (value: string) => {
    setSelectedInterests((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const toggleTransportMode = (value: string) => {
    setSelectedTransportModes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const updatePreference = (key: keyof Preferences, value: string) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  // Validation
  const dateError = Boolean(startDate && endDate && endDate < startDate);
  const requiredComplete =
    countries.length > 0 &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    !dateError &&
    selectedInterests.length > 0 &&
    Boolean(budget) &&
    selectedTransportModes.length > 0;

  const completionCount = useMemo(
    () =>
      [
        countries.length > 0,
        Boolean(startDate && endDate && !dateError),
        selectedInterests.length > 0,
        Boolean(budget),
        selectedTransportModes.length > 0,
      ].filter(Boolean).length,
    [countries, startDate, endDate, dateError, selectedInterests, budget, selectedTransportModes]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    if (requiredComplete) {
      setRequestError('');
      setIsGenerating(true);
      try {
        const countryPayload: CountryPlanItem[] = countries.map((c, index) => ({
          country: c.country,
          countryCode: c.code,
          order: index + 1,
          days: c.days,
          cities: c.cities,
        }));

        const response = await fetch('/api/travel-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinations: countries.map((c) => c.country),
            countries: countryPayload,
            startDate,
            endDate,
            travelStyles: selectedInterests,
            interests: selectedInterests,
            budget,
            transportation: selectedTransportModes.join(', '),
            transportModes: selectedTransportModes,
            travelers: preferences.travelers,
            preferences,
          }),
        });

        const data = (await response.json()) as TravelPlan | { error?: string };
        if (!response.ok) {
          throw new Error('error' in data && data.error ? data.error : 'Plan oluşturulurken bir hata oluştu.');
        }
        setPlan(data as TravelPlan);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Plan oluşturulurken bir hata oluştu.';
        setRequestError(msg);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const inputClass = (hasError = false) =>
    `h-12 w-full rounded-[13px] border bg-[#fbfaf5] px-4 text-[13px] text-[#164b4a] outline-none transition placeholder:text-[#9aac9f] focus:border-[#26726a] focus:ring-4 focus:ring-[#26726a]/10 ${
      hasError ? 'border-[#d66f4e] bg-[#fff7f1]' : 'border-[#dddccf]'
    }`;

  if (plan) {
    return (
      <TravelPlanResult
        plan={plan}
        onBack={() => {
          setPlan(null);
          setAttempted(false);
          setRequestError('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <main className="paper-grain min-h-[100dvh] overflow-hidden bg-[#f4f1e7]">
      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-[1260px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Logo />
        <nav className="hidden items-center gap-8 text-[12px] font-semibold text-[#628078] md:flex" aria-label="Ana menü">
          <a href="#planlayici" className="transition hover:text-[#164b4a]" data-testid="link-planlayici">
            Planlayıcı
          </a>
          <a href="#nasil-calisir" className="transition hover:text-[#164b4a]" data-testid="link-nasil-calisir">
            Nasıl çalışır?
          </a>
          <span className="flex items-center gap-2 rounded-full border border-[#d5ded2] bg-[#edf1e7] px-3 py-2 text-[11px] text-[#508078]">
            <span className="size-1.5 rounded-full bg-[#5aa878]" /> Akıllı Rota V2
          </span>
        </nav>
        <button
          type="button"
          onClick={() => document.getElementById('planlayici')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-2 rounded-full border border-[#d5ded2] px-3 py-2 text-[11px] font-semibold text-[#376963] transition hover:border-[#26726a] md:hidden"
          data-testid="button-mobile-menu"
        >
          <Route size={14} /> Başla
        </button>
      </header>

      {/* Hero & Form Section */}
      <section className="relative mx-auto max-w-[1260px] px-5 pb-16 pt-6 sm:px-8 lg:px-12 lg:pb-24 lg:pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(300px,0.72fr)_minmax(580px,1.28fr)] lg:gap-16">
          {/* Left Column: Explanatory copy */}
          <div className="pt-2 lg:sticky lg:top-8">
            <div className="mb-5 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[#c26b50]">
              <span className="h-px w-8 bg-[#d66f4e]" /> Adım Adım Rota Tasarımı
            </div>
            <h1 className="max-w-[500px] font-display text-[clamp(38px,5.5vw,70px)] font-bold leading-[0.96] tracking-[-0.06em] text-[#164b4a]">
              Aklındaki yolculuğa<br />
              <span className="text-[#d66f4e]">bir yön ver.</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[15px] leading-7 text-[#5f7770]">
              Ülkeleri ve şehirleri istediğin sırada diz, günlerini paylaştır, çoklu ulaşım araçlarını belirle. Yolüstü, Google Haritalar rotalarıyla hazır eksiksiz bir seyahat programı oluştursun.
            </p>

            <div className="mt-8 space-y-3.5">
              <div className="flex items-center gap-3 rounded-2xl border border-[#d3dfd5] bg-[#edf4ee] p-3.5 text-[12px] text-[#26726a]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#26726a] text-[#fff]">
                  <Check size={14} strokeWidth={3} />
                </span>
                <span>
                  <strong>Ülke sırası garantisi:</strong> Belirlediğin sıralama kesinlikle değiştirilmez.
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#d3dfd5] bg-[#edf4ee] p-3.5 text-[12px] text-[#26726a]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#26726a] text-[#fff]">
                  <Check size={14} strokeWidth={3} />
                </span>
                <span>
                  <strong>Google Maps entegrasyonu:</strong> Her günün rotası tek tıkla navigasyonda hazır.
                </span>
              </div>
            </div>

            <div className="mt-10 hidden items-center gap-3 lg:flex" id="nasil-calisir">
              <div className="h-px w-12 bg-[#bdcec2]" />
              <span className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-[#78918a]">
                Sen sırayı ve günleri seç · AI haritayı kursun
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <form
            id="planlayici"
            onSubmit={handleSubmit}
            className="animate-float-in relative rounded-[28px] border border-[#d8ded1] bg-[#faf9f3] p-5 shadow-[var(--shadow-soft)] sm:p-8 lg:p-10"
          >
            {/* Form Progress Bar */}
            <div className="mb-8 flex items-center justify-between border-b border-[#e2e4d9] pb-5">
              <div>
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.17em] text-[#78918a]">Seyahat Konfigürasyonu</div>
                <div className="mt-1 font-display text-[17px] font-bold text-[#164b4a]">Rotanı Hazırla</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-ui text-[11px] font-bold text-[#26726a]" data-testid="text-completion">
                  {completionCount}/5 tamamlandı
                </span>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e3e6dc]">
                  <div
                    className="h-full rounded-full bg-[#d66f4e] transition-all duration-500"
                    style={{ width: `${completionCount * 20}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {/* SECTION 1: DATES & TOTAL DURATION */}
              <section>
                <SectionHeading
                  number="01"
                  eyebrow="Tarihler"
                  title="Seyahat takvimini belirle"
                  hint="Toplam seyahat günün ülkelere dağıtılacaktır."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>Başlangıç Tarihi</FieldLabel>
                    <div className="relative">
                      <CalendarDays size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6d9b8d]" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`${inputClass(attempted && !startDate)} pl-11`}
                        data-testid="input-start-date"
                        aria-label="Başlangıç tarihi"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel required>Bitiş Tarihi</FieldLabel>
                    <div className="relative">
                      <CalendarDays size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6d9b8d]" />
                      <input
                        type="date"
                        min={startDate || undefined}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`${inputClass(attempted && (!endDate || dateError))} pl-11`}
                        data-testid="input-end-date"
                        aria-label="Bitiş tarihi"
                      />
                    </div>
                  </div>
                </div>
                {attempted && dateError && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#c25e48]">
                    <CircleAlert size={13} /> Bitiş tarihi başlangıç tarihinden sonra olmalıdır.
                  </p>
                )}
                {totalTripDays > 0 && !dateError && (
                  <div className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#26726a]">
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#26726a] text-[10px] text-white">✓</span>
                    <span>Toplam seyahat süresi: <strong>{totalTripDays} gün</strong></span>
                  </div>
                )}
              </section>

              {/* SECTION 2: COUNTRIES, ORDERING, DAYS PER COUNTRY, & CITIES (Requirements 2, 3, 4) */}
              <section>
                <SectionHeading
                  number="02"
                  eyebrow="Rota & Duraklar"
                  title="Ülkeleri sırala, günleri ve şehirleri seç"
                  hint="Ülkeleri oklarla yukarı/aşağı taşıyarak rotanın sırasını belirleyebilirsin."
                />

                {/* Country Input */}
                <FieldLabel required>Ülke Ekle</FieldLabel>
                <div
                  className={`flex h-12 items-center gap-2 rounded-[13px] border bg-[#fbfaf5] px-3 transition focus-within:border-[#26726a] focus-within:ring-4 focus-within:ring-[#26726a]/10 ${
                    attempted && countries.length === 0 ? 'border-[#d66f4e] bg-[#fff7f1]' : 'border-[#dddccf]'
                  }`}
                >
                  <MapPin size={17} className="ml-1 shrink-0 text-[#6d9b8d]" />
                  <input
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCountry();
                      }
                    }}
                    placeholder="Örn. Kuzey Makedonya, Karadağ, Sırbistan..."
                    className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-[#164b4a] outline-none placeholder:text-[#9aac9f]"
                    data-testid="input-country"
                    aria-label="Ülke adı"
                  />
                  <button
                    type="button"
                    onClick={() => addCountry()}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e7eee2] text-[#26726a] transition hover:bg-[#d6e4d9]"
                    data-testid="button-add-country"
                    aria-label="Ülke ekle"
                  >
                    <Plus size={17} />
                  </button>
                </div>

                {/* Quick Add Preset Country Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#78918a]">Hızlı Ekle:</span>
                  {[
                    'Kuzey Makedonya',
                    'Karadağ',
                    'Sırbistan',
                    'Bosna-Hersek',
                    'Yunanistan',
                    'İtalya',
                  ].map((pName) => {
                    const isAdded = countries.some(
                      (c) => c.country.toLocaleLowerCase('tr-TR') === pName.toLocaleLowerCase('tr-TR')
                    );
                    return (
                      <button
                        key={pName}
                        type="button"
                        disabled={isAdded}
                        onClick={() => addCountry(pName)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                          isAdded
                            ? 'cursor-not-allowed border-[#dbe3db] bg-[#eef3ee] text-[#9bb0a5]'
                            : 'border-[#cbd9ce] bg-[#fbfaf5] text-[#365957] hover:border-[#26726a] hover:bg-[#edf4ee]'
                        }`}
                        data-testid={`button-preset-${pName.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <span>{getCountryFlag(pName)}</span>
                        <span>{pName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Day Distribution Status Banner & Auto-Distribute Button (Requirement 3 & 12) */}
                {countries.length > 0 && totalTripDays > 0 && (
                  <div
                    className={`mt-5 flex flex-col gap-3 rounded-[16px] border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      totalAllocatedDays === totalTripDays
                        ? 'border-[#b8d8c5] bg-[#e8f3e9] text-[#26726a]'
                        : totalAllocatedDays > totalTripDays
                        ? 'border-[#edc7bb] bg-[#fff1eb] text-[#b9553e]'
                        : 'border-[#cfdfdb] bg-[#edf4f2] text-[#285750]'
                    }`}
                  >
                    <div className="text-[12px]">
                      {totalAllocatedDays === totalTripDays ? (
                        <div className="flex items-center gap-2 font-bold">
                          <Check size={16} strokeWidth={3} />
                          <span>{totalTripDays} günün tamamı ülkelere dengeli dağıtıldı.</span>
                        </div>
                      ) : totalAllocatedDays > totalTripDays ? (
                        <div className="flex items-center gap-2 font-bold">
                          <CircleAlert size={16} />
                          <span>
                            Dağıtılan gün sayısı ({totalAllocatedDays} gün), seyahat süresini ({totalTripDays} gün){' '}
                            {totalAllocatedDays - totalTripDays} gün aşıyor!
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 font-bold">
                          <Info size={16} />
                          <span>
                            {totalTripDays - totalAllocatedDays} gününüz henüz dağıtılmadı. (Seyahat: {totalTripDays} gün, Dağıtılan: {totalAllocatedDays} gün)
                          </span>
                        </div>
                      )}
                      <p className="mt-0.5 text-[11px] opacity-85">
                        Ülke kartlarındaki <strong>[ - ]</strong> ve <strong>[ + ]</strong> butonlarıyla ayarlayabilirsin.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoDistribute}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#26726a] bg-[#26726a] px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#1f5c56]"
                      data-testid="button-auto-distribute"
                    >
                      <Wand2 size={13} /> Günleri Otomatik Dağıt
                    </button>
                  </div>
                )}

                {/* Ordered List of Countries (Requirements 2, 3, 4) */}
                {countries.length > 0 && (
                  <div className="mt-5 space-y-4" data-testid="list-countries">
                    {countries.map((c, index) => {
                      const popularPresetCities = getPopularCitiesForCountry(c.country);

                      return (
                        <div
                          key={c.id}
                          className="rounded-[20px] border border-[#d6dfd3] bg-[#fbfaf5] p-4.5 shadow-sm transition hover:border-[#b0c8ba] sm:p-5"
                          data-testid={`country-card-${index}`}
                        >
                          {/* Card Header: Order, Flag, Country Name, Reorder Arrows, Delete */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6ebdf] pb-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-7 items-center justify-center rounded-full bg-[#164b4a] font-mono-ui text-[12px] font-bold text-[#f8f3e3]">
                                {index + 1}
                              </span>
                              <span className="text-[20px]">{getCountryFlag(c.country)}</span>
                              <span className="font-display text-[17px] font-bold text-[#164b4a]">
                                {c.country}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveCountry(index, 'up')}
                                title="Yukarı Taşı"
                                className="flex size-8 items-center justify-center rounded-lg border border-[#cbd9ce] bg-[#faf8f2] text-[#365957] transition hover:bg-[#e7eee2] disabled:cursor-not-allowed disabled:opacity-30"
                                data-testid={`button-move-up-${index}`}
                              >
                                <ArrowUp size={15} />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={index === countries.length - 1}
                                onClick={() => moveCountry(index, 'down')}
                                title="Aşağı Taşı"
                                className="flex size-8 items-center justify-center rounded-lg border border-[#cbd9ce] bg-[#faf8f2] text-[#365957] transition hover:bg-[#e7eee2] disabled:cursor-not-allowed disabled:opacity-30"
                                data-testid={`button-move-down-${index}`}
                              >
                                <ArrowDown size={15} />
                              </button>

                              {/* Remove Country */}
                              <button
                                type="button"
                                onClick={() => removeCountry(c.id)}
                                title={`${c.country} ülkesini kaldır`}
                                className="ml-1 flex size-8 items-center justify-center rounded-lg border border-[#eed1c6] bg-[#fff3ed] text-[#b9553e] transition hover:bg-[#fcdfd5]"
                                data-testid={`button-remove-country-${index}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Days Stepper (Requirement 3) */}
                          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-[12px] font-semibold text-[#486b63]">
                              Bu Ülkede Konaklama / Seyahat Süresi:
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-[#cbd9ce] bg-[#eef4ec] p-1">
                              <button
                                type="button"
                                onClick={() => updateCountryDays(c.id, -1)}
                                disabled={c.days <= 1}
                                className="flex size-7 items-center justify-center rounded-lg bg-[#ffffff] font-bold text-[#26726a] shadow-xs transition hover:bg-[#e2ede4] disabled:opacity-40"
                                data-testid={`button-minus-days-${index}`}
                              >
                                -
                              </button>
                              <span
                                className="min-w-[58px] text-center font-display text-[14px] font-bold text-[#164b4a]"
                                data-testid={`text-country-days-${index}`}
                              >
                                {c.days} gün
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCountryDays(c.id, 1)}
                                className="flex size-7 items-center justify-center rounded-lg bg-[#ffffff] font-bold text-[#26726a] shadow-xs transition hover:bg-[#e2ede4]"
                                data-testid={`button-plus-days-${index}`}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* City Selection Inside Country (Requirement 4) */}
                          <div className="mt-4 rounded-xl border border-[#e4ebe0] bg-[#fdfcf9] p-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d8a81]">
                                Gezilecek Şehirler & Duraklar ({c.cities.length})
                              </span>
                              <span className="text-[10px] text-[#9aac9f]">Sıralamayı oklarla değiştirebilirsin</span>
                            </div>

                            {/* Popular city checkbox pills */}
                            {popularPresetCities.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {popularPresetCities.map((cityName) => {
                                  const isSelected = c.cities.includes(cityName);
                                  return (
                                    <button
                                      key={cityName}
                                      type="button"
                                      onClick={() => toggleCityInCountry(c.id, cityName)}
                                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                                        isSelected
                                          ? 'border-[#26726a] bg-[#e4f0e9] text-[#26726a]'
                                          : 'border-[#d4dfd4] bg-[#fafaf6] text-[#55736c] hover:border-[#8eaea0]'
                                      }`}
                                      data-testid={`checkbox-city-${cityName.replace(/\s+/g, '-').toLowerCase()}`}
                                    >
                                      <span
                                        className={`flex size-3.5 items-center justify-center rounded-sm border ${
                                          isSelected
                                            ? 'border-[#26726a] bg-[#26726a] text-white'
                                            : 'border-[#b0c4b6] bg-white'
                                        }`}
                                      >
                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                      </span>
                                      <span>{cityName}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Ordered Selected Cities list with up/down */}
                            {c.cities.length > 0 && (
                              <div className="mt-3 space-y-1.5 border-t border-[#edf2ea] pt-2.5">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#78918a]">
                                  Şehir Ziyaret Sırası:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {c.cities.map((city, cIdx) => (
                                    <div
                                      key={city}
                                      className="inline-flex items-center gap-1 rounded-full border border-[#b9d3c4] bg-[#eaf3ec] py-1 pl-2.5 pr-1.5 text-[11px] font-bold text-[#1f5c56]"
                                    >
                                      <span>{cIdx + 1}.</span>
                                      <span>{city}</span>
                                      <div className="ml-1 flex items-center">
                                        <button
                                          type="button"
                                          disabled={cIdx === 0}
                                          onClick={() => moveCityInCountry(c.id, cIdx, 'up')}
                                          className="p-0.5 text-[#56907f] hover:text-[#164b4a] disabled:opacity-25"
                                          title="Öne al"
                                        >
                                          <ArrowUp size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={cIdx === c.cities.length - 1}
                                          onClick={() => moveCityInCountry(c.id, cIdx, 'down')}
                                          className="p-0.5 text-[#56907f] hover:text-[#164b4a] disabled:opacity-25"
                                          title="Sonraya al"
                                        >
                                          <ArrowDown size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => toggleCityInCountry(c.id, city)}
                                          className="ml-1 p-0.5 text-[#8aa396] hover:text-[#c25e48]"
                                          title="Kaldır"
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Add Custom City Input */}
                            <div className="mt-3 flex items-center gap-2">
                              <input
                                value={cityInputs[c.id] || ''}
                                onChange={(e) =>
                                  setCityInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustomCity(c.id);
                                  }
                                }}
                                placeholder="+ Başka bir şehir ekle..."
                                className="h-8 flex-1 rounded-lg border border-[#d2ded3] bg-[#fbfaf5] px-2.5 text-[11px] text-[#164b4a] outline-none placeholder:text-[#9aac9f] focus:border-[#26726a]"
                                data-testid={`input-custom-city-${index}`}
                              />
                              <button
                                type="button"
                                onClick={() => addCustomCity(c.id)}
                                className="flex h-8 items-center gap-1 rounded-lg bg-[#e7eee2] px-2.5 text-[11px] font-bold text-[#26726a] transition hover:bg-[#d6e4d9]"
                                data-testid={`button-add-custom-city-${index}`}
                              >
                                <Plus size={13} /> Ekle
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {attempted && countries.length === 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#c25e48]">
                    <CircleAlert size={13} /> Lütfen rotan için en az bir ülke seç.
                  </p>
                )}
              </section>

              {/* SECTION 3: MULTI-SELECT TRANSPORTATION (Requirement 1) */}
              <section>
                <SectionHeading
                  number="03"
                  eyebrow="Ulaşım & Seyahat Şekli"
                  title="Yolda nasıl ilerleyelim?"
                  hint="Aynı anda birden fazla ulaşım tercihi seçebilirsin (Örn: Araba + Tren + Yürüyüş). AI durumlara göre en mantıklı geçişleri planlayacaktır."
                />

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#365957]">
                    Seçilen Ulaşım Yöntemleri ({selectedTransportModes.length})
                  </span>
                  {selectedTransportModes.length > 0 && (
                    <span className="font-mono-ui text-[11px] font-bold text-[#26726a]">
                      {selectedTransportModes.join(' + ')}
                    </span>
                  )}
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {transportOptions.map((option) => {
                    const isSelected = selectedTransportModes.includes(option.value);
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => toggleTransportMode(option.value)}
                        aria-pressed={isSelected}
                        data-testid={`button-transport-${option.value.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                        className={`group relative flex min-h-[64px] items-center gap-3 rounded-[14px] border p-3 text-left transition duration-200 ${
                          isSelected
                            ? 'border-[#26726a] bg-[#e4f0e9] text-[#164b4a] shadow-[inset_0_0_0_1px_#26726a]'
                            : 'border-[#dddccf] bg-[#fbfaf5] text-[#365957] hover:-translate-y-0.5 hover:border-[#8eaea0] hover:bg-[#f5f3e9]'
                        }`}
                      >
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition ${
                            isSelected ? 'bg-[#26726a] text-[#f8f3e3]' : 'bg-[#e9eee5] text-[#50817a]'
                          }`}
                        >
                          {option.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold">{option.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-[#78908a]">{option.note}</span>
                        </span>
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                            isSelected
                              ? 'border-[#26726a] bg-[#26726a] text-[#fff8ea]'
                              : 'border-[#b8c9be] text-transparent'
                          }`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {attempted && selectedTransportModes.length === 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#c25e48]">
                    <CircleAlert size={13} /> En az bir ulaşım yöntemi seçmelisin.
                  </p>
                )}
              </section>

              {/* SECTION 4: INTERESTS */}
              <section>
                <SectionHeading
                  number="04"
                  eyebrow="İlgi Alanları"
                  title="Seni en çok ne çağırıyor?"
                  hint="Birden fazla ilgi alanı seçebilirsin."
                />
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {interestsList.map((interest) => {
                    const selected = selectedInterests.includes(interest.value);
                    return (
                      <button
                        type="button"
                        key={interest.value}
                        onClick={() => toggleInterest(interest.value)}
                        aria-pressed={selected}
                        data-testid={`button-interest-${interest.value}`}
                        className={`flex min-h-[52px] items-center gap-2 rounded-[13px] border px-3 text-left text-[12px] font-semibold transition duration-200 ${
                          selected
                            ? 'border-[#26726a] bg-[#e4f0e9] text-[#26726a] shadow-[inset_0_0_0_1px_#26726a]'
                            : 'border-[#dddccf] bg-[#fbfaf5] text-[#55736c] hover:-translate-y-0.5 hover:border-[#8eaea0]'
                        }`}
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-[#26726a] bg-[#26726a] text-[#fff8ea]' : 'border-[#b8c9be] text-transparent'
                          }`}
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>
                        {interest.label}
                      </button>
                    );
                  })}
                </div>
                {attempted && selectedInterests.length === 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#c25e48]">
                    <CircleAlert size={13} /> En az bir ilgi alanı seç.
                  </p>
                )}
              </section>

              {/* SECTION 5: BUDGET */}
              <section>
                <SectionHeading number="05" eyebrow="Bütçe" title="Ritmini belirle" hint="Yaklaşık bir tercih yeterli." />
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {budgets.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setBudget(option.value)}
                      data-testid={`button-budget-${option.value}`}
                      aria-pressed={budget === option.value}
                      className={`group relative flex min-h-[64px] w-full items-center gap-3 rounded-[14px] border px-4 text-left transition duration-200 ${
                        budget === option.value
                          ? 'border-[#26726a] bg-[#e4f0e9] text-[#164b4a] shadow-[inset_0_0_0_1px_#26726a]'
                          : 'border-[#dddccf] bg-[#fbfaf5] text-[#365957] hover:-translate-y-0.5 hover:border-[#8eaea0] hover:bg-[#f5f3e9]'
                      }`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                          budget === option.value ? 'bg-[#26726a] text-[#f8f3e3]' : 'bg-[#e9eee5] text-[#50817a]'
                        }`}
                      >
                        <WalletCards size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold">{option.label}</span>
                        {option.note && <span className="mt-0.5 block text-[11px] leading-4 text-[#78908a]">{option.note}</span>}
                      </span>
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                          budget === option.value
                            ? 'border-[#26726a] bg-[#26726a] text-[#fff8ea]'
                            : 'border-[#b8c9be] text-transparent'
                        }`}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* SECTION 6: OPTIONAL PREFERENCES ACCORDION */}
              <section className="border-t border-[#e2e4d9] pt-7">
                <button
                  type="button"
                  onClick={() => setShowPreferences((current) => !current)}
                  className="flex w-full items-center justify-between text-left"
                  aria-expanded={showPreferences}
                  data-testid="button-toggle-preferences"
                >
                  <span>
                    <span className="flex items-center gap-2 font-display text-[17px] font-bold text-[#164b4a]">
                      <Sparkles size={16} className="text-[#d66f4e]" /> Detaylı Tercihler{' '}
                      <span className="font-sans text-[11px] font-medium text-[#78918a]">(isteğe bağlı)</span>
                    </span>
                    <span className="mt-1 block text-[12px] text-[#78918a]">Kişi sayısı, başlama saati ve yürüme iştahı</span>
                  </span>
                  <span
                    className={`flex size-8 items-center justify-center rounded-full bg-[#e7eee2] text-[#26726a] transition-transform ${
                      showPreferences ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown size={17} />
                  </span>
                </button>

                {showPreferences && (
                  <div className="animate-float-in mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <FieldLabel>
                        <Users size={14} className="text-[#6d9b8d]" /> Kaç kişisiniz?
                      </FieldLabel>
                      <div className="relative">
                        <Users size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6d9b8d]" />
                        <select
                          value={preferences.travelers}
                          onChange={(e) => updatePreference('travelers', e.target.value)}
                          className={`${inputClass()} appearance-none pl-11`}
                          data-testid="select-travelers"
                        >
                          <option value="1">1 kişi</option>
                          <option value="2">2 kişi</option>
                          <option value="3">3 kişi</option>
                          <option value="4+">4+ kişi</option>
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6d9b8d]" />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>
                        <BedDouble size={14} className="text-[#6d9b8d]" /> Konaklama Tarzı
                      </FieldLabel>
                      <div className="relative">
                        <BedDouble size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6d9b8d]" />
                        <select
                          value={preferences.accommodation}
                          onChange={(e) => updatePreference('accommodation', e.target.value)}
                          className={`${inputClass()} appearance-none pl-11`}
                          data-testid="select-accommodation"
                        >
                          <option value="">Fark etmez</option>
                          <option value="otel">Otel</option>
                          <option value="butik">Butik konaklama</option>
                          <option value="ev">Daire / Ev</option>
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6d9b8d]" />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>
                        <Clock3 size={14} className="text-[#6d9b8d]" /> Güne başlama saati
                      </FieldLabel>
                      <div className="relative">
                        <SunMedium size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d49745]" />
                        <input
                          type="time"
                          value={preferences.startTime}
                          onChange={(e) => updatePreference('startTime', e.target.value)}
                          className={`${inputClass()} pl-11`}
                          data-testid="input-start-time"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>
                        <Moon size={14} className="text-[#6d9b8d]" /> Günü bitirme saati
                      </FieldLabel>
                      <div className="relative">
                        <Moon size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6d9b8d]" />
                        <input
                          type="time"
                          value={preferences.endTime}
                          onChange={(e) => updatePreference('endTime', e.target.value)}
                          className={`${inputClass()} pl-11`}
                          data-testid="input-end-time"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>
                        <Footprints size={14} className="text-[#6d9b8d]" /> Yürüme İştahı
                      </FieldLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ['az', 'Az yürüyüş'],
                          ['orta', 'Dengeli'],
                          ['cok', 'Bol bol yürüyüş'],
                        ].map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updatePreference('walking', val)}
                            className={`rounded-[11px] border py-2.5 text-[11px] font-semibold transition ${
                              preferences.walking === val
                                ? 'border-[#26726a] bg-[#e4f0e9] text-[#26726a]'
                                : 'border-[#dddccf] bg-[#fbfaf5] text-[#64817a] hover:border-[#8eaea0]'
                            }`}
                            data-testid={`button-walking-${val}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Status Messages */}
            {isGenerating && (
              <div
                className="mt-8 flex items-center gap-3 rounded-[16px] border border-[#d6dcae] bg-[#fff8dc] p-4 text-[#9e791b]"
                role="status"
                data-testid="status-loading"
              >
                <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-[#d6dcae] border-t-[#c26b50]" />
                <div>
                  <div className="text-[13px] font-bold">Seyahat planın ve Google Maps rotaların hazırlanıyor...</div>
                  <p className="mt-1 text-[12px] text-[#a68c3c]">
                    Ülke sıran, gün kotaların ve çoklu ulaşım tercihlerin harita etaplarına dönüştürülüyor.
                  </p>
                </div>
              </div>
            )}

            {requestError && (
              <div
                className="mt-8 flex items-start gap-3 rounded-[16px] border border-[#edc7bb] bg-[#fff1eb] p-4 text-[#b9553e]"
                role="alert"
                data-testid="status-error"
              >
                <CircleAlert size={18} className="mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-bold">{requestError}</div>
                  <p className="mt-1 text-[12px] text-[#c26b50]">Bilgilerini kontrol edip tekrar deneyebilirsin.</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 border-t border-[#e2e4d9] pt-6">
              <button
                type="submit"
                disabled={isGenerating}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-[#164b4a] px-6 text-[14px] font-bold text-[#f8f3e3] shadow-[0_8px_0_#c9d7c5] transition duration-200 hover:-translate-y-0.5 hover:bg-[#236660] active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-70"
                data-testid="button-submit"
              >
                {isGenerating ? 'Plan ve Rotalar Hazırlanıyor...' : 'Seyahatimi Planla'}
                <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-[#8a9d94]">
                <Info size={12} /> Belirlediğin ülke sırasına ve gün kotalarına tam uyumlu Google Haritalar rotası oluşturulur.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1260px] flex-col gap-4 border-t border-[#d9ded2] px-5 py-7 text-[11px] text-[#78918a] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div className="flex items-center gap-2">
          <Heart size={13} className="text-[#d66f4e]" /> İyi yolculuklar, iyi fikirler.
        </div>
        <div className="font-mono-ui text-[10px] uppercase tracking-[0.13em]">yolüstü / çoklu rota</div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#d8ded1] bg-[#f4f1e7]/95 p-3 backdrop-blur-md sm:hidden">
        <button
          type="button"
          onClick={() => document.getElementById('planlayici')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#164b4a] text-[13px] font-bold text-[#f8f3e3] shadow-[0_5px_0_#c9d7c5]"
          data-testid="button-mobile-start"
        >
          <Navigation size={16} /> Seyahatini Planla
        </button>
      </div>
    </main>
  );
}

export default Home;
