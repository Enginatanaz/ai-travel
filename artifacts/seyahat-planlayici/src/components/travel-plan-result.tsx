import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Check,
  Compass,
  ExternalLink,
  Footprints,
  Lightbulb,
  MapPin,
  Navigation,
  Route,
  Sparkles,
  Timer,
  TrainFront,
  Bike,
  Plane,
} from "lucide-react";
import {
  type TravelPlan,
  buildGoogleMapsDirectionUrl,
  buildGoogleMapsSearchUrl,
} from "@workspace/api-client-react";
import { getCountryFlag } from "@/lib/destinations-data";

function formatDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(parsed);
}

function intensityClass(intensity: string) {
  if (intensity === "Yoğun") {
    return "border-[#edc7bb] bg-[#fff1eb] text-[#b9553e]";
  }
  if (intensity === "Dengeli") {
    return "border-[#f0dfae] bg-[#fff8dc] text-[#9e791b]";
  }
  return "border-[#b8d8c5] bg-[#e8f3e9] text-[#26726a]";
}

function getModeIcon(mode?: string) {
  const m = (mode || "").toLowerCase();
  if (m === "walking") return <Footprints size={14} className="text-[#26726a]" />;
  if (m === "transit") return <TrainFront size={14} className="text-[#26726a]" />;
  if (m === "bicycling") return <Bike size={14} className="text-[#26726a]" />;
  if (m === "flight" || m === "plane") return <Plane size={14} className="text-[#26726a]" />;
  return <CarFront size={14} className="text-[#26726a]" />;
}

function getModeLabel(mode?: string) {
  const m = (mode || "").toLowerCase();
  if (m === "walking") return "Yürüyüş Rotası";
  if (m === "transit") return "Toplu Taşıma / Tren";
  if (m === "bicycling") return "Bisiklet Rotası";
  return "Sürüş Rotası";
}

export function TravelPlanResult({
  plan,
  onBack,
}: {
  plan: TravelPlan;
  onBack: () => void;
}) {
  return (
    <main className="paper-grain min-h-[100dvh] overflow-hidden bg-[#f4f1e7]">
      <header className="relative z-10 mx-auto flex max-w-[1220px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[13px] bg-[#f5cf55] text-[#164b4a] shadow-[4px_4px_0_#164b4a]">
            <Navigation size={22} strokeWidth={2.4} />
          </div>
          <div className="leading-none">
            <div className="font-display text-[20px] font-bold tracking-[-0.05em] text-[#164b4a]">yolüstü</div>
            <div className="mt-1 font-mono-ui text-[8px] uppercase tracking-[0.22em] text-[#64817a]">kişiselleştirilmiş seyahat planın</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-[#cbd9ce] bg-[#edf1e7] px-4 py-2.5 text-[12px] font-semibold text-[#26726a] transition hover:border-[#26726a] hover:bg-[#dfeade]"
          data-testid="button-back-to-form"
        >
          <ArrowLeft size={15} /> Tercihleri düzenle
        </button>
      </header>

      <section className="mx-auto max-w-[1220px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        {/* Hero title */}
        <div className="mb-8 max-w-[840px] animate-float-in">
          <div className="mb-3 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[#c26b50]">
            <span className="h-px w-8 bg-[#d66f4e]" /> Kesin Sıralı Seyahat Taslağı
          </div>
          <h1 className="font-display text-[clamp(34px,5.5vw,64px)] font-bold leading-[1.02] tracking-[-0.055em] text-[#164b4a]">
            {plan.tripSummary.title}
          </h1>
          <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#5f7770]">
            {plan.tripSummary.description}
          </p>
        </div>

        {/* General Route Pipeline (Requirement 8) */}
        <div className="mb-8 rounded-[24px] border border-[#d8ded1] bg-[#faf9f3] p-5 shadow-[var(--shadow-soft)] sm:p-7">
          <div className="mb-4 flex items-center justify-between border-b border-[#e2e4d9] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#26726a] text-[#f8f3e3]">
                <Route size={16} />
              </span>
              <div>
                <h3 className="font-display text-[17px] font-bold text-[#164b4a]">Genel Rota ve Ülke Geçişleri</h3>
                <p className="text-[11px] text-[#78918a]">Kullanıcının belirlediği sıra korunmuştur</p>
              </div>
            </div>
            <span className="rounded-full border border-[#c4d9c9] bg-[#e4f0e9] px-3 py-1 text-[11px] font-semibold text-[#26726a]">
              {plan.tripSummary.totalDays} Günlük Rota
            </span>
          </div>

          {/* Stepped Route Pipeline visual */}
          <div className="flex flex-wrap items-center gap-2 py-2">
            <div className="flex items-center gap-1.5 rounded-full bg-[#164b4a] px-3 py-1.5 text-[11px] font-bold text-[#f8f3e3]">
              <Compass size={13} /> Başlangıç
            </div>
            <span className="text-[#9aac9f]">➔</span>

            {plan.tripSummary.countries.map((countryName, idx) => {
              const overview = plan.tripSummary.countryOverviews?.find(
                (o) => o.country.toLowerCase() === countryName.toLowerCase()
              );
              const daysCount = overview ? overview.days : undefined;

              return (
                <div key={countryName} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-[#cbd9ce] bg-[#edf1e7] px-3 py-1.5 text-[12px] font-bold text-[#164b4a]">
                    <span>{getCountryFlag(countryName)}</span>
                    <span>{idx + 1}. {countryName}</span>
                    {daysCount !== undefined && (
                      <span className="rounded-full bg-[#26726a] px-2 py-0.5 text-[10px] font-bold text-[#fff]">
                        {daysCount} gün
                      </span>
                    )}
                  </div>
                  {idx < plan.tripSummary.countries.length - 1 ? (
                    <span className="text-[#9aac9f]">➔</span>
                  ) : (
                    <span className="text-[#9aac9f]">➔</span>
                  )}
                </div>
              );
            })}

            <div className="flex items-center gap-1.5 rounded-full bg-[#d66f4e] px-3 py-1.5 text-[11px] font-bold text-[#f8f3e3]">
              <Check size={13} /> Bitiş
            </div>
          </div>

          {/* Country Cards with Entry, Exit, Next Transit */}
          {plan.tripSummary.countryOverviews && plan.tripSummary.countryOverviews.length > 0 && (
            <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {plan.tripSummary.countryOverviews.map((co, cIdx) => (
                <div
                  key={`${co.country}-${cIdx}`}
                  className="rounded-[18px] border border-[#e1e6db] bg-[#fdfcf9] p-4 text-[12px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-display text-[15px] font-bold text-[#164b4a]">
                      <span className="text-[18px]">{getCountryFlag(co.country)}</span>
                      <span>{co.country}</span>
                    </div>
                    <span className="rounded-full border border-[#cbd9ce] bg-[#edf1e7] px-2.5 py-0.5 font-mono-ui text-[11px] font-bold text-[#26726a]">
                      {co.days} gün
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[#55736c]">
                    <div>
                      <span className="font-semibold text-[#365957]">Gezilen Şehirler:</span>{" "}
                      {co.cities && co.cities.length > 0 ? co.cities.join(", ") : "Belirlenen rota"}
                    </div>
                    {co.entryCity && (
                      <div>
                        <span className="font-semibold text-[#365957]">Giriş Noktası:</span> {co.entryCity}
                      </div>
                    )}
                    {co.exitCity && (
                      <div>
                        <span className="font-semibold text-[#365957]">Çıkış Noktası:</span> {co.exitCity}
                      </div>
                    )}
                    {co.nextTransit && (
                      <div className="mt-2 rounded-lg bg-[#f0f5ec] p-2 text-[11px] text-[#2c6158]">
                        <span className="font-bold">Sonraki Ülkeye İntikal:</span> {co.nextTransit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alternative Route Suggestion if any */}
          {plan.tripSummary.alternativeRouteSuggestion && (
            <div className="mt-5 flex items-start gap-3 rounded-[16px] border border-[#ecd9ab] bg-[#fffbf0] p-4 text-[#8a681c]">
              <Lightbulb size={18} className="mt-0.5 shrink-0 text-[#d49745]" />
              <div className="text-[12px] leading-5">
                <strong className="block text-[13px] text-[#70520e]">Alternatif Rota Tavsiyesi</strong>
                {plan.tripSummary.alternativeRouteSuggestion}
                <p className="mt-1 text-[11px] text-[#a68c3c]">
                  * Mevcut planınız seçtiğiniz sıralamaya tam sadık kalınarak oluşturulmuştur.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          {/* Left Column: Summary and Cities list */}
          <aside className="space-y-5">
            <div className="rounded-[24px] border border-[#d8ded1] bg-[#faf9f3] p-5 shadow-[var(--shadow-soft)] sm:p-7">
              <div className="mb-5 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.17em] text-[#78918a]">
                <Sparkles size={14} className="text-[#d66f4e]" /> Rota İstatistikleri
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] bg-[#edf1e7] p-4">
                  <CalendarDays size={18} className="mb-2 text-[#26726a]" />
                  <div className="font-display text-2xl font-bold text-[#164b4a]">{plan.tripSummary.totalDays}</div>
                  <div className="mt-0.5 text-[11px] text-[#78918a]">toplam gün</div>
                </div>
                <div className="rounded-[16px] bg-[#fff5d3] p-4">
                  <MapPin size={18} className="mb-2 text-[#c26b50]" />
                  <div className="font-display text-2xl font-bold text-[#164b4a]">{plan.tripSummary.cities.length}</div>
                  <div className="mt-0.5 text-[11px] text-[#78918a]">farklı şehir</div>
                </div>
              </div>

              {/* Countries */}
              <div className="mt-5 border-t border-[#e2e4d9] pt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#78918a]">
                  Seçilen Ülkeler ({plan.tripSummary.countries.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.tripSummary.countries.map((country, cIdx) => (
                    <span
                      key={country}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#c4d9c9] bg-[#e4f0e9] px-3 py-1.5 text-[11px] font-semibold text-[#26726a]"
                    >
                      <span>{getCountryFlag(country)}</span>
                      <span>{cIdx + 1}. {country}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* City Sequence */}
              <div className="mt-5 border-t border-[#e2e4d9] pt-5">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#78918a]">
                  Şehir Ziyaret Sırası
                </div>
                <div className="space-y-2">
                  {plan.route.map((stop) => (
                    <div key={`${stop.order}-${stop.city}`} className="flex items-center gap-3 text-[13px] font-semibold text-[#365957]">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#164b4a] font-mono-ui text-[10px] text-[#f8f3e3]">
                        {stop.order}
                      </span>
                      <span>{stop.city}</span>
                      {stop.order < plan.route.length && <Route size={13} className="ml-auto text-[#9eb6a8]" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Practical Advice Banner */}
            <div className="rounded-[22px] border border-[#b8d8c5] bg-[#e8f3e9] p-5 text-[#26726a] sm:p-6">
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#26726a] text-[#f8f3e3]">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[13px] font-bold">Harita ve Rota Bağlantıları Aktif</div>
                  <p className="mt-1 text-[12px] leading-5 text-[#508078]">
                    Her günün başında yer alan yeşil <strong>Google Maps</strong> butonuna basarak o günün etap rotasını doğrudan navigasyona aktarabilirsin. Mekanların yanındaki butonlarla da doğrudan konum bilgilerine ulaşabilirsin.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Daily Program with Google Maps Buttons */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#164b4a] text-[#f8f3e3]">
                  <Route size={17} />
                </div>
                <div>
                  <h2 className="font-display text-[20px] font-bold text-[#164b4a]">Günlük Seyahat Akışı</h2>
                  <div className="text-[12px] text-[#78918a]">Her gün için hazır Google Maps rotaları</div>
                </div>
              </div>
            </div>

            {plan.days.map((day, dayIndex) => {
              const directionUrl =
                day.googleMapsUrl ||
                buildGoogleMapsDirectionUrl({
                  origin: day.origin || (day.activities[0]?.name ? `${day.activities[0].name}, ${day.city}` : day.city),
                  destination:
                    day.destination ||
                    (day.activities[day.activities.length - 1]?.name
                      ? `${day.activities[day.activities.length - 1].name}, ${day.city}`
                      : day.city),
                  waypoints: day.waypoints,
                  travelMode: day.travelMode,
                });

              return (
                <article
                  key={`${day.date}-${day.city}-${dayIndex}`}
                  className="animate-float-in rounded-[24px] border border-[#d8ded1] bg-[#faf9f3] p-5 shadow-[var(--shadow-soft)] sm:p-7"
                  style={{ animationDelay: `${dayIndex * 50}ms` }}
                >
                  {/* Day Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e4d9] pb-4">
                    <div>
                      <div className="font-mono-ui text-[11px] font-bold uppercase tracking-[0.14em] text-[#c26b50]">
                        {dayIndex + 1}. Gün · {formatDate(day.date)}
                      </div>
                      <h3 className="mt-1 flex items-center gap-2 font-display text-[22px] font-bold tracking-[-0.035em] text-[#164b4a]">
                        <MapPin size={18} className="text-[#6d9b8d]" /> {day.city}
                        {day.country && (
                          <span className="text-[13px] font-medium text-[#78918a]">({day.country})</span>
                        )}
                      </h3>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${intensityClass(day.intensity)}`}>
                      {day.intensity} Ritim
                    </span>
                  </div>

                  {/* Day Route & Google Maps Button (Requirements 5 & 6) */}
                  <div className="mt-4 flex flex-col gap-2.5 rounded-[16px] border border-[#bedbca] bg-[#eaf4ec] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#1a554c]">
                        {getModeIcon(day.travelMode)}
                        <span>{dayIndex + 1}. Gün Rotası:</span>
                        <span className="truncate font-medium text-[#3b7368]">
                          {day.origin ? day.origin : day.city} ➔ {day.destination ? day.destination : day.city}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#5b877c]">
                        {getModeLabel(day.travelMode)} · {day.activities.length} durak
                      </div>
                    </div>

                    <a
                      href={directionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`button-google-maps-day-${dayIndex + 1}`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#26726a] px-4 py-2.5 text-[12px] font-bold text-[#f8f3e3] shadow-[0_3px_0_#174843] transition hover:-translate-y-0.5 hover:bg-[#1f5c56] active:translate-y-0.5 active:shadow-none"
                    >
                      <ExternalLink size={14} /> Google Maps'te Rotayı Aç →
                    </a>
                  </div>

                  {/* Activities list with Place Google Maps Links (Requirement 7) */}
                  <div className="mt-5 space-y-1">
                    {day.activities.map((activity, activityIndex) => {
                      const placeSearchUrl =
                        activity.googleMapsUrl ||
                        buildGoogleMapsSearchUrl(`${activity.name}, ${day.city}`);

                      return (
                        <div
                          key={`${activity.time}-${activity.name}-${activityIndex}`}
                          className="group grid grid-cols-[54px_18px_1fr] gap-3 py-3"
                        >
                          <div className="pt-0.5 font-mono-ui text-[11px] font-semibold text-[#26726a]">
                            {activity.time}
                          </div>
                          <div className="relative flex justify-center">
                            <span className="relative z-[1] mt-1.5 size-2.5 rounded-full bg-[#d66f4e] ring-4 ring-[#fff0e8]" />
                            {activityIndex < day.activities.length - 1 && (
                              <span className="absolute top-4 h-full w-px bg-[#d8e2d8]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[13.5px] font-bold text-[#164b4a]">
                                {activity.name}
                              </span>
                              <span className="rounded-full bg-[#edf1e7] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#78918a]">
                                {activity.category}
                              </span>
                            </div>

                            <p className="mt-1 max-w-[560px] text-[12.5px] leading-5 text-[#6a817b]">
                              {activity.description}
                            </p>

                            <div className="mt-2.5 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1 text-[11px] font-medium text-[#9aac9f]">
                                <Timer size={12} /> {activity.durationMinutes} dakika
                              </span>

                              {/* Google Maps Button per Place (Requirement 7) */}
                              <a
                                href={placeSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${activity.name} konumunu Google Haritalar'da incele`}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[#c7dacb] bg-[#eef5ee] px-2 py-0.5 text-[11px] font-semibold text-[#236b63] transition hover:border-[#26726a] hover:bg-[#dfeade] hover:text-[#164b4a]"
                                data-testid={`button-place-map-${activity.name.replace(/\s+/g, '-').toLowerCase()}`}
                              >
                                <MapPin size={11} className="text-[#d66f4e]" /> Google Maps'te Aç
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1220px] items-center justify-between border-t border-[#d9ded2] px-5 py-7 text-[11px] text-[#78918a] sm:px-8 lg:px-12">
        <span className="flex items-center gap-2">
          <CarFront size={13} className="text-[#d66f4e]" /> Çoklu ulaşım ve sıralı duraklar plana başarıyla işlendi.
        </span>
        <span className="font-mono-ui uppercase tracking-[0.13em]">yolüstü / akıllı rota</span>
      </footer>
    </main>
  );
}
