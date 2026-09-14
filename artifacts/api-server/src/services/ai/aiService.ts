import {
  type TravelPlan,
  type TravelPlanRequest,
  buildGoogleMapsDirectionUrl,
  buildGoogleMapsSearchUrl,
} from "@workspace/api-zod";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type AiServiceErrorCode = "missing_api_key" | "upstream_error" | "invalid_response";

export class AiServiceError extends Error {
  constructor(
    public readonly code: AiServiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AiServiceError";
  }
}

const responseSchema = {
  type: "OBJECT",
  properties: {
    tripSummary: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        countries: { type: "ARRAY", items: { type: "STRING" } },
        cities: { type: "ARRAY", items: { type: "STRING" } },
        totalDays: { type: "INTEGER" },
        countryOverviews: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              country: { type: "STRING" },
              days: { type: "INTEGER" },
              cities: { type: "ARRAY", items: { type: "STRING" } },
              entryCity: { type: "STRING" },
              exitCity: { type: "STRING" },
              nextTransit: { type: "STRING" },
            },
            required: ["country", "days", "cities"],
          },
        },
        alternativeRouteSuggestion: { type: "STRING" },
      },
      required: ["title", "description", "countries", "cities", "totalDays"],
    },
    route: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          city: { type: "STRING" },
          order: { type: "INTEGER" },
        },
        required: ["city", "order"],
      },
    },
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING" },
          city: { type: "STRING" },
          country: { type: "STRING" },
          intensity: {
            type: "STRING",
            enum: ["Rahat", "Dengeli", "Yoğun"],
          },
          origin: { type: "STRING" },
          destination: { type: "STRING" },
          waypoints: { type: "ARRAY", items: { type: "STRING" } },
          travelMode: { type: "STRING" },
          activities: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                time: { type: "STRING" },
                name: { type: "STRING" },
                category: { type: "STRING" },
                durationMinutes: { type: "INTEGER" },
                description: { type: "STRING" },
              },
              required: [
                "time",
                "name",
                "category",
                "durationMinutes",
                "description",
              ],
            },
          },
        },
        required: ["date", "city", "intensity", "activities"],
      },
    },
  },
  required: ["tripSummary", "route", "days"],
};

function buildPrompt(request: TravelPlanRequest): string {
  const startDate = request.startDate.toISOString().slice(0, 10);
  const endDate = request.endDate.toISOString().slice(0, 10);

  const countriesText = request.countries && request.countries.length > 0
    ? request.countries
        .sort((a, b) => a.order - b.order)
        .map(
          (c, idx) =>
            `${idx + 1}. Ülke: ${c.country} (${c.days} gün) — Tercih edilen şehirler: ${
              c.cities && c.cities.length > 0 ? c.cities.join(", ") : "AI belirlesin"
            }`,
        )
        .join("\n")
    : request.destinations.map((d, i) => `${i + 1}. Durak: ${d}`).join("\n");

  const transportText = request.transportModes && request.transportModes.length > 0
    ? request.transportModes.join(" + ")
    : request.transportation;

  return `Aşağıdaki seyahat brief'i için uygulanabilir, gerçekçi, coğrafi açıdan optimize edilmiş ve Türkçe bir seyahat planı oluştur.

KULLANICI BİLGİLERİ VE SEÇİMLERİ:
---------------------------------------------
Seyahat Tarihleri: ${startDate} — ${endDate}
Hedef Ülkeler / Duraklar (KULLANICININ BELİRLEDİĞİ KESİN SIRA):
${countriesText}

Ulaşım Tercihleri: ${transportText}
İlgi Alanları: ${request.interests.join(", ")}
Bütçe Ritim: ${request.budget}
Kişi Sayısı: ${request.travelers}
Günlük Zaman Tercihleri: ${request.preferences.startTime} başlama - ${request.preferences.endTime} bitiş
Yürüme İştahı: ${request.preferences.walking}
Konaklama Tipi: ${request.preferences.accommodation || "Standart/Merkezi"}

ÖNEMLİ KURALLAR:
1. KULLANICININ ÜLKE SIRALAMASINI ASLA DEĞİŞTİRME: Plan harfiyen yukarıda verilen ülke sırasına (1, 2, 3...) göre ilerlemelidir.
2. GÜN SAYILARI: Kullanıcının her ülke için belirlediği gün sayılarına tam olarak uyulmalıdır. Belirtilen gün sayılarını aşma ya da eksik bırakma.
3. TARİH UYUMU: ${startDate} tarihinden başlayıp ${endDate} tarihine kadar her bir gün için ardışık gün (days) nesnesi oluştur.
4. ÇOKLU ULAŞIM YORUMLAMASI: Kullanıcı birden fazla ulaşım aracı seçti (${transportText}). Bunları seyahat bağlamına göre mantıklı dağıt:
   - Şehirler ve ülkeler arası intikallerde seçilen uygun aracı (örneğin araba veya tren) kullan.
   - Şehir içi keşiflerde seçilen araç veya yürüyüşü kullan.
5. GÜNLÜK ROTA VE HARİTA BİLGİLERİ:
   - Her gün için mantıklı bir başlangıç noktası (origin, örn. "Üsküp Şehir Merkezi" veya ilk otel/meydan) ve bitiş noktası (destination, örn. "Matka Kanyonu" veya "Ohrid") belirle.
   - O günün aktivitelerinden en fazla 2-3 önemli ara durağı waypoints dizisine ekle.
   - travelMode olarak "driving", "walking", "transit", "bicycling" değerlerinden günün dinamiğine en uygun olanını yaz.
6. MEKAN VE AKTİVİTELER:
   - Her gün için 3-6 adet gerçekçi, birbirine yürüme veya kısa sürüş mesafesinde mantıklı gruplanmış aktiviteler oluştur.
   - Her mekanın adı tam ve Google Haritalar'da kolayca bulunabilecek şekilde net olmalı (örn. "Taş Köprü", "Matka Kanyonu", "Kotor Eski Şehir", "Aziz Yuhanna Kalesi").
   - Aktivite sürelerini dakika cinsinden ver.
   - "Rahat", "Dengeli" veya "Yoğun" yoğunluk değerlerinden birini kullan.
7. GENEL ÖZET VE ÜLKE GEÇİŞLERİ (countryOverviews):
   - Her ülke için: country, days, gezilen cities, giriş noktası/şehri (entryCity), çıkış noktası/şehri (exitCity), ve sonraki ülkeye intikal yöntemi (nextTransit) bilgilerini doldur.
8. ALTERNATİF ROTA ÖNERİSİ (alternativeRouteSuggestion):
   - Eğer coğrafi açıdan sürüş/seyahat mesafesini kısaltacak alternatif bir sıra varsa, bunu yalnızca 'alternativeRouteSuggestion' alanında bir tavsiye notu olarak yaz; fakat ana planı kullanıcının seçtiği sırayla oluştur!
9. Yalnızca istenen JSON şemasına uygun yanıt ver.`;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}

function postProcessPlan(plan: TravelPlan, request: TravelPlanRequest): TravelPlan {
  // Ensure every day has accurate, working Google Maps direction URLs
  const primaryTravelMode = (() => {
    const modes = (request.transportModes || []).map((m) => m.toLowerCase());
    if (modes.some((m) => m.includes("yuruyus") || m.includes("walk"))) return "walking";
    if (modes.some((m) => m.includes("arac") || m.includes("araba") || m.includes("car"))) return "driving";
    if (modes.some((m) => m.includes("toplu") || m.includes("tren") || m.includes("otobus"))) return "transit";
    if (modes.some((m) => m.includes("bisiklet") || m.includes("bike"))) return "bicycling";
    return "driving";
  })();

  const processedDays = plan.days.map((day, idx) => {
    const activityNames = day.activities.map((a) => a.name).filter(Boolean);
    const origin = day.origin || (activityNames[0] ? `${activityNames[0]}, ${day.city}` : day.city);
    const destination =
      day.destination ||
      (activityNames.length > 1
        ? `${activityNames[activityNames.length - 1]}, ${day.city}`
        : origin);

    const intermediateWaypoints = (day.waypoints && day.waypoints.length > 0)
      ? day.waypoints
      : activityNames.slice(1, -1).slice(0, 4).map((name) => `${name}, ${day.city}`);

    const travelMode = day.travelMode || primaryTravelMode;

    const googleMapsUrl = buildGoogleMapsDirectionUrl({
      origin,
      destination,
      waypoints: intermediateWaypoints,
      travelMode,
    });

    const activitiesWithMaps = day.activities.map((activity) => {
      const searchTarget = `${activity.name}, ${day.city}`;
      return {
        ...activity,
        googleMapsUrl: activity.googleMapsUrl || buildGoogleMapsSearchUrl(searchTarget),
      };
    });

    return {
      ...day,
      origin,
      destination,
      waypoints: intermediateWaypoints,
      travelMode,
      googleMapsUrl,
      activities: activitiesWithMaps,
    };
  });

  return {
    ...plan,
    days: processedDays,
  };
}

export async function generateTravelPlan(
  request: TravelPlanRequest,
): Promise<TravelPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError(
      "missing_api_key",
      "GEMINI_API_KEY is not configured.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "Sen gerçekçi, titiz ve coğrafi rotaları mükemmel planlayan bir seyahat rehberi asistanısın. Kullanıcının ülke sırasına ve gün kotalarına harfiyen uyarsın. Yanıtlarını yalnızca istenen JSON şemasına uygun üret.",
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: buildPrompt(request) }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema,
          maxOutputTokens: 8192,
        },
      }),
    });
  } catch (error) {
    throw new AiServiceError(
      "upstream_error",
      "Gemini API request failed.",
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new AiServiceError(
      "upstream_error",
      `Gemini API returned ${response.status}.`,
    );
  }

  let payload: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  try {
    payload = (await response.json()) as typeof payload;
  } catch (error) {
    throw new AiServiceError("invalid_response", "Gemini response was not JSON.", {
      cause: error,
    });
  }

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new AiServiceError(
      "invalid_response",
      "Gemini response did not contain a travel plan.",
    );
  }

  try {
    const parsed = JSON.parse(extractJson(rawText));
    const { GenerateTravelPlanResponse } = await import("@workspace/api-zod");
    const validatedPlan = GenerateTravelPlanResponse.parse(parsed) as TravelPlan;
    return postProcessPlan(validatedPlan, request);
  } catch (error) {
    throw new AiServiceError(
      "invalid_response",
      "Gemini returned an invalid travel plan.",
      { cause: error },
    );
  }
}
