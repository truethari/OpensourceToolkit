export interface ITimezoneMeta {
  /** IANA timezone identifier, e.g. "Europe/London" */
  tz: string;
  /** Friendly city label */
  city: string;
  /** Country / region label */
  country: string;
  /** Broad continent grouping used for the picker */
  region: string;
  /** Extra search terms (airport codes, alt names) */
  aliases?: string[];
}

/**
 * Curated list of commonly used timezones. Kept explicit (rather than relying on
 * Intl.supportedValuesOf) so every entry has a human-friendly city + country and
 * searchable aliases. The full IANA list is still available via
 * `getAllSupportedTimezones()` below as a fallback.
 */
export const TIMEZONES: ITimezoneMeta[] = [
  // ── UTC / reference ───────────────────────────────────────────────────────
  {
    tz: "UTC",
    city: "UTC",
    country: "Coordinated Universal Time",
    region: "UTC",
    aliases: ["gmt", "zulu", "z"],
  },

  // ── Americas ──────────────────────────────────────────────────────────────
  {
    tz: "America/Los_Angeles",
    city: "Los Angeles",
    country: "United States",
    region: "Americas",
    aliases: [
      "pst",
      "pdt",
      "pacific",
      "la",
      "san francisco",
      "seattle",
      "lax",
      "sfo",
    ],
  },
  {
    tz: "America/Vancouver",
    city: "Vancouver",
    country: "Canada",
    region: "Americas",
    aliases: ["pst", "yvr"],
  },
  {
    tz: "America/Phoenix",
    city: "Phoenix",
    country: "United States",
    region: "Americas",
    aliases: ["mst", "arizona", "phx"],
  },
  {
    tz: "America/Denver",
    city: "Denver",
    country: "United States",
    region: "Americas",
    aliases: ["mst", "mdt", "mountain", "den"],
  },
  {
    tz: "America/Chicago",
    city: "Chicago",
    country: "United States",
    region: "Americas",
    aliases: ["cst", "cdt", "central", "ord", "dallas", "houston"],
  },
  {
    tz: "America/Mexico_City",
    city: "Mexico City",
    country: "Mexico",
    region: "Americas",
    aliases: ["cst", "mex"],
  },
  {
    tz: "America/New_York",
    city: "New York",
    country: "United States",
    region: "Americas",
    aliases: [
      "est",
      "edt",
      "eastern",
      "nyc",
      "jfk",
      "boston",
      "miami",
      "atlanta",
    ],
  },
  {
    tz: "America/Toronto",
    city: "Toronto",
    country: "Canada",
    region: "Americas",
    aliases: ["est", "edt", "yyz"],
  },
  {
    tz: "America/Bogota",
    city: "Bogotá",
    country: "Colombia",
    region: "Americas",
    aliases: ["cot", "bog"],
  },
  {
    tz: "America/Lima",
    city: "Lima",
    country: "Peru",
    region: "Americas",
    aliases: ["pet", "lim"],
  },
  {
    tz: "America/Santiago",
    city: "Santiago",
    country: "Chile",
    region: "Americas",
    aliases: ["clt", "scl"],
  },
  {
    tz: "America/Sao_Paulo",
    city: "São Paulo",
    country: "Brazil",
    region: "Americas",
    aliases: ["brt", "gru", "brasilia"],
  },
  {
    tz: "America/Argentina/Buenos_Aires",
    city: "Buenos Aires",
    country: "Argentina",
    region: "Americas",
    aliases: ["art", "eze"],
  },
  {
    tz: "America/Halifax",
    city: "Halifax",
    country: "Canada",
    region: "Americas",
    aliases: ["ast", "adt"],
  },
  {
    tz: "America/Anchorage",
    city: "Anchorage",
    country: "United States",
    region: "Americas",
    aliases: ["akst", "alaska"],
  },
  {
    tz: "Pacific/Honolulu",
    city: "Honolulu",
    country: "United States",
    region: "Americas",
    aliases: ["hst", "hawaii", "hnl"],
  },

  // ── Europe ────────────────────────────────────────────────────────────────
  {
    tz: "Europe/London",
    city: "London",
    country: "United Kingdom",
    region: "Europe",
    aliases: ["gmt", "bst", "uk", "lhr", "england"],
  },
  {
    tz: "Europe/Dublin",
    city: "Dublin",
    country: "Ireland",
    region: "Europe",
    aliases: ["ist", "dub"],
  },
  {
    tz: "Europe/Lisbon",
    city: "Lisbon",
    country: "Portugal",
    region: "Europe",
    aliases: ["wet", "lis"],
  },
  {
    tz: "Europe/Madrid",
    city: "Madrid",
    country: "Spain",
    region: "Europe",
    aliases: ["cet", "cest", "mad", "barcelona"],
  },
  {
    tz: "Europe/Paris",
    city: "Paris",
    country: "France",
    region: "Europe",
    aliases: ["cet", "cest", "cdg"],
  },
  {
    tz: "Europe/Brussels",
    city: "Brussels",
    country: "Belgium",
    region: "Europe",
    aliases: ["cet", "bru"],
  },
  {
    tz: "Europe/Amsterdam",
    city: "Amsterdam",
    country: "Netherlands",
    region: "Europe",
    aliases: ["cet", "ams"],
  },
  {
    tz: "Europe/Berlin",
    city: "Berlin",
    country: "Germany",
    region: "Europe",
    aliases: ["cet", "cest", "ber", "munich", "frankfurt"],
  },
  {
    tz: "Europe/Zurich",
    city: "Zurich",
    country: "Switzerland",
    region: "Europe",
    aliases: ["cet", "zrh"],
  },
  {
    tz: "Europe/Rome",
    city: "Rome",
    country: "Italy",
    region: "Europe",
    aliases: ["cet", "fco", "milan"],
  },
  {
    tz: "Europe/Vienna",
    city: "Vienna",
    country: "Austria",
    region: "Europe",
    aliases: ["cet", "vie"],
  },
  {
    tz: "Europe/Prague",
    city: "Prague",
    country: "Czechia",
    region: "Europe",
    aliases: ["cet", "prg"],
  },
  {
    tz: "Europe/Warsaw",
    city: "Warsaw",
    country: "Poland",
    region: "Europe",
    aliases: ["cet", "waw"],
  },
  {
    tz: "Europe/Stockholm",
    city: "Stockholm",
    country: "Sweden",
    region: "Europe",
    aliases: ["cet", "arn"],
  },
  {
    tz: "Europe/Oslo",
    city: "Oslo",
    country: "Norway",
    region: "Europe",
    aliases: ["cet", "osl"],
  },
  {
    tz: "Europe/Copenhagen",
    city: "Copenhagen",
    country: "Denmark",
    region: "Europe",
    aliases: ["cet", "cph"],
  },
  {
    tz: "Europe/Helsinki",
    city: "Helsinki",
    country: "Finland",
    region: "Europe",
    aliases: ["eet", "hel"],
  },
  {
    tz: "Europe/Athens",
    city: "Athens",
    country: "Greece",
    region: "Europe",
    aliases: ["eet", "ath"],
  },
  {
    tz: "Europe/Bucharest",
    city: "Bucharest",
    country: "Romania",
    region: "Europe",
    aliases: ["eet", "otp"],
  },
  {
    tz: "Europe/Kyiv",
    city: "Kyiv",
    country: "Ukraine",
    region: "Europe",
    aliases: ["eet", "kiev", "iev"],
  },
  {
    tz: "Europe/Istanbul",
    city: "Istanbul",
    country: "Turkey",
    region: "Europe",
    aliases: ["trt", "ist"],
  },
  {
    tz: "Europe/Moscow",
    city: "Moscow",
    country: "Russia",
    region: "Europe",
    aliases: ["msk", "svo"],
  },

  // ── Africa / Middle East ──────────────────────────────────────────────────
  {
    tz: "Africa/Casablanca",
    city: "Casablanca",
    country: "Morocco",
    region: "Africa & Middle East",
    aliases: ["wet", "cmn"],
  },
  {
    tz: "Africa/Lagos",
    city: "Lagos",
    country: "Nigeria",
    region: "Africa & Middle East",
    aliases: ["wat", "los"],
  },
  {
    tz: "Africa/Cairo",
    city: "Cairo",
    country: "Egypt",
    region: "Africa & Middle East",
    aliases: ["eet", "cai"],
  },
  {
    tz: "Africa/Johannesburg",
    city: "Johannesburg",
    country: "South Africa",
    region: "Africa & Middle East",
    aliases: ["sast", "jnb"],
  },
  {
    tz: "Africa/Nairobi",
    city: "Nairobi",
    country: "Kenya",
    region: "Africa & Middle East",
    aliases: ["eat", "nbo"],
  },
  {
    tz: "Asia/Jerusalem",
    city: "Jerusalem",
    country: "Israel",
    region: "Africa & Middle East",
    aliases: ["ist", "idt", "tlv"],
  },
  {
    tz: "Asia/Riyadh",
    city: "Riyadh",
    country: "Saudi Arabia",
    region: "Africa & Middle East",
    aliases: ["ast", "ruh"],
  },
  {
    tz: "Asia/Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    region: "Africa & Middle East",
    aliases: ["gst", "dxb", "uae", "abu dhabi"],
  },
  {
    tz: "Asia/Tehran",
    city: "Tehran",
    country: "Iran",
    region: "Africa & Middle East",
    aliases: ["irst", "thr"],
  },

  // ── Asia ──────────────────────────────────────────────────────────────────
  {
    tz: "Asia/Karachi",
    city: "Karachi",
    country: "Pakistan",
    region: "Asia",
    aliases: ["pkt", "khi"],
  },
  {
    tz: "Asia/Kolkata",
    city: "Mumbai / Kolkata",
    country: "India",
    region: "Asia",
    aliases: ["ist", "india", "bom", "delhi", "bangalore", "calcutta"],
  },
  {
    tz: "Asia/Colombo",
    city: "Colombo",
    country: "Sri Lanka",
    region: "Asia",
    aliases: ["ist", "cmb"],
  },
  {
    tz: "Asia/Kathmandu",
    city: "Kathmandu",
    country: "Nepal",
    region: "Asia",
    aliases: ["npt", "ktm"],
  },
  {
    tz: "Asia/Dhaka",
    city: "Dhaka",
    country: "Bangladesh",
    region: "Asia",
    aliases: ["bst", "dac"],
  },
  {
    tz: "Asia/Yangon",
    city: "Yangon",
    country: "Myanmar",
    region: "Asia",
    aliases: ["mmt", "rgn"],
  },
  {
    tz: "Asia/Bangkok",
    city: "Bangkok",
    country: "Thailand",
    region: "Asia",
    aliases: ["ict", "bkk"],
  },
  {
    tz: "Asia/Jakarta",
    city: "Jakarta",
    country: "Indonesia",
    region: "Asia",
    aliases: ["wib", "cgk"],
  },
  {
    tz: "Asia/Ho_Chi_Minh",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    region: "Asia",
    aliases: ["ict", "saigon", "sgn"],
  },
  {
    tz: "Asia/Singapore",
    city: "Singapore",
    country: "Singapore",
    region: "Asia",
    aliases: ["sgt", "sin"],
  },
  {
    tz: "Asia/Kuala_Lumpur",
    city: "Kuala Lumpur",
    country: "Malaysia",
    region: "Asia",
    aliases: ["myt", "kul"],
  },
  {
    tz: "Asia/Manila",
    city: "Manila",
    country: "Philippines",
    region: "Asia",
    aliases: ["pht", "mnl"],
  },
  {
    tz: "Asia/Hong_Kong",
    city: "Hong Kong",
    country: "Hong Kong",
    region: "Asia",
    aliases: ["hkt", "hkg"],
  },
  {
    tz: "Asia/Shanghai",
    city: "Shanghai / Beijing",
    country: "China",
    region: "Asia",
    aliases: ["cst", "china", "pvg", "pek"],
  },
  {
    tz: "Asia/Taipei",
    city: "Taipei",
    country: "Taiwan",
    region: "Asia",
    aliases: ["cst", "tpe"],
  },
  {
    tz: "Asia/Seoul",
    city: "Seoul",
    country: "South Korea",
    region: "Asia",
    aliases: ["kst", "icn"],
  },
  {
    tz: "Asia/Tokyo",
    city: "Tokyo",
    country: "Japan",
    region: "Asia",
    aliases: ["jst", "japan", "nrt", "hnd", "osaka"],
  },

  // ── Oceania ───────────────────────────────────────────────────────────────
  {
    tz: "Australia/Perth",
    city: "Perth",
    country: "Australia",
    region: "Oceania",
    aliases: ["awst", "per"],
  },
  {
    tz: "Australia/Adelaide",
    city: "Adelaide",
    country: "Australia",
    region: "Oceania",
    aliases: ["acst", "acdt", "adl"],
  },
  {
    tz: "Australia/Brisbane",
    city: "Brisbane",
    country: "Australia",
    region: "Oceania",
    aliases: ["aest", "bne"],
  },
  {
    tz: "Australia/Sydney",
    city: "Sydney",
    country: "Australia",
    region: "Oceania",
    aliases: ["aest", "aedt", "syd", "melbourne", "canberra"],
  },
  {
    tz: "Australia/Melbourne",
    city: "Melbourne",
    country: "Australia",
    region: "Oceania",
    aliases: ["aest", "aedt", "mel"],
  },
  {
    tz: "Pacific/Auckland",
    city: "Auckland",
    country: "New Zealand",
    region: "Oceania",
    aliases: ["nzst", "nzdt", "akl", "wellington"],
  },
  {
    tz: "Pacific/Fiji",
    city: "Suva",
    country: "Fiji",
    region: "Oceania",
    aliases: ["fjt", "suv"],
  },
];

export const TIMEZONE_MAP: Record<string, ITimezoneMeta> = TIMEZONES.reduce(
  (acc, t) => {
    acc[t.tz] = t;
    return acc;
  },
  {} as Record<string, ITimezoneMeta>,
);

/** Every IANA zone the runtime knows about (used to supplement the curated list). */
export function getAllSupportedTimezones(): string[] {
  try {
    const withValues = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof withValues.supportedValuesOf === "function") {
      return withValues.supportedValuesOf("timeZone");
    }
  } catch {
    // Older runtimes — fall back to the curated list.
  }
  return TIMEZONES.map((t) => t.tz);
}

/** Look up metadata for a zone, synthesising a label for uncurated IANA zones. */
export function getTimezoneMeta(tz: string): ITimezoneMeta {
  if (TIMEZONE_MAP[tz]) return TIMEZONE_MAP[tz];
  const parts = tz.split("/");
  const city = (parts[parts.length - 1] || tz).replace(/_/g, " ");
  const region = parts.length > 1 ? parts[0].replace(/_/g, " ") : "Other";
  return { tz, city, country: region, region: "Other" };
}

/** Popular team-collaboration presets. */
export const TIMEZONE_PRESETS: {
  name: string;
  description: string;
  zones: string[];
}[] = [
  {
    name: "US Business",
    description: "The four continental US zones",
    zones: [
      "America/Los_Angeles",
      "America/Denver",
      "America/Chicago",
      "America/New_York",
    ],
  },
  {
    name: "Global Engineering",
    description: "SF · New York · London · Bangalore · Sydney",
    zones: [
      "America/Los_Angeles",
      "America/New_York",
      "Europe/London",
      "Asia/Kolkata",
      "Australia/Sydney",
    ],
  },
  {
    name: "Europe",
    description: "London · Berlin · Athens",
    zones: ["Europe/London", "Europe/Berlin", "Europe/Athens"],
  },
  {
    name: "APAC",
    description: "Singapore · Hong Kong · Tokyo · Sydney",
    zones: [
      "Asia/Singapore",
      "Asia/Hong_Kong",
      "Asia/Tokyo",
      "Australia/Sydney",
    ],
  },
  {
    name: "Remote Dev Hubs",
    description: "Lisbon · Warsaw · Bangalore · Manila · São Paulo",
    zones: [
      "Europe/Lisbon",
      "Europe/Warsaw",
      "Asia/Kolkata",
      "Asia/Manila",
      "America/Sao_Paulo",
    ],
  },
  {
    name: "Finance Markets",
    description: "New York · London · Frankfurt · Hong Kong · Tokyo",
    zones: [
      "America/New_York",
      "Europe/London",
      "Europe/Berlin",
      "Asia/Hong_Kong",
      "Asia/Tokyo",
    ],
  },
];
