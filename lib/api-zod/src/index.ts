import * as z from "zod";

export const HealthCheckResponse = z.object({
  status: z.string(),
});

export const CountryPlanItemSchema = z.object({
  country: z.string(),
  countryCode: z.string().optional(),
  order: z.number(),
  days: z.number(),
  cities: z.array(z.string()).default([]),
});
export type CountryPlanItem = z.infer<typeof CountryPlanItemSchema>;

export const CountryOverviewSchema = z.object({
  country: z.string(),
  days: z.number(),
  cities: z.array(z.string()),
  entryCity: z.string().optional(),
  exitCity: z.string().optional(),
  nextTransit: z.string().optional(),
});
export type CountryOverview = z.infer<typeof CountryOverviewSchema>;

export const GenerateTravelPlanBody = z.object({
  destinations: z.array(z.string()),
  countries: z.array(CountryPlanItemSchema).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  travelStyles: z.array(z.string()),
  interests: z.array(z.string()),
  budget: z.string(),
  transportation: z.string(),
  transportModes: z.array(z.string()).optional(),
  travelers: z.string(),
  preferences: z.object({
    accommodation: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    walking: z.string(),
  }),
});

export const generateTravelPlanResponseDaysItemActivitiesItemDurationMinutesMin = 0;

export const TravelActivitySchema = z.object({
  time: z.string(),
  name: z.string(),
  category: z.string(),
  durationMinutes: z.number(),
  description: z.string(),
  googleMapsUrl: z.string().optional(),
});

export const TravelDayIntensity = {
  Rahat: "Rahat",
  Dengeli: "Dengeli",
  Yoğun: "Yoğun",
} as const;

export type TravelDayIntensity = (typeof TravelDayIntensity)[keyof typeof TravelDayIntensity];

export const TravelDaySchema = z.object({
  date: z.string(),
  city: z.string(),
  country: z.string().optional(),
  intensity: z.enum(["Rahat", "Dengeli", "Yoğun"]),
  origin: z.string().optional(),
  destination: z.string().optional(),
  waypoints: z.array(z.string()).optional(),
  travelMode: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  activities: z.array(TravelActivitySchema),
});

export const GenerateTravelPlanResponse = z.object({
  tripSummary: z.object({
    title: z.string(),
    description: z.string(),
    countries: z.array(z.string()),
    cities: z.array(z.string()),
    totalDays: z.number(),
    countryOverviews: z.array(CountryOverviewSchema).optional(),
    alternativeRouteSuggestion: z.string().optional(),
  }),
  route: z.array(
    z.object({
      city: z.string(),
      order: z.number(),
    })
  ),
  days: z.array(TravelDaySchema),
});

export interface HealthStatus {
  status: string;
}

export interface ErrorResponse {
  error: string;
}

export interface RouteCity {
  city: string;
  order: number;
}

export type TravelActivity = z.infer<typeof TravelActivitySchema>;
export type TravelDay = z.infer<typeof TravelDaySchema>;

export interface TripSummary {
  title: string;
  description: string;
  countries: string[];
  cities: string[];
  totalDays: number;
  countryOverviews?: CountryOverview[];
  alternativeRouteSuggestion?: string;
}

export interface TravelPlan {
  tripSummary: TripSummary;
  route: RouteCity[];
  days: TravelDay[];
}

export interface TravelPreferences {
  accommodation: string;
  startTime: string;
  endTime: string;
  walking: string;
}

export interface TravelPlanRequest {
  destinations: string[];
  countries?: CountryPlanItem[];
  startDate: Date;
  endDate: Date;
  travelStyles: string[];
  interests: string[];
  budget: string;
  transportation: string;
  transportModes?: string[];
  travelers: string;
  preferences: TravelPreferences;
}

export function buildGoogleMapsDirectionUrl(params: {
  origin: string;
  destination: string;
  waypoints?: string[];
  travelMode?: "driving" | "walking" | "bicycling" | "transit" | string;
}): string {
  const parts: string[] = [
    "api=1",
    `origin=${encodeURIComponent(params.origin)}`,
    `destination=${encodeURIComponent(params.destination)}`,
  ];
  if (params.waypoints && params.waypoints.length > 0) {
    const validWaypoints = params.waypoints.slice(0, 9).filter(Boolean);
    if (validWaypoints.length > 0) {
      parts.push(`waypoints=${encodeURIComponent(validWaypoints.join("|"))}`);
    }
  }
  const mode = (params.travelMode || "driving").toLowerCase();
  const validModes = ["driving", "walking", "bicycling", "transit"];
  parts.push(`travelmode=${validModes.includes(mode) ? mode : "driving"}`);
  return `https://www.google.com/maps/dir/?${parts.join("&")}`;
}

export function buildGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}


