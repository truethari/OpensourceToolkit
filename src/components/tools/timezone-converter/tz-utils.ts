/**
 * Timezone math built on the Temporal API (via temporal-polyfill).
 *
 * Temporal models the concepts this tool surfaces directly: `ZonedDateTime`
 * carries an exact instant plus a zone, DST disambiguation is a first-class
 * option, and `getTimeZoneTransition` reports offset changes exactly. That
 * removes the need for hand-rolled offset inversion and transition scanning.
 */
import { Temporal } from "temporal-polyfill";

const NS_PER_MINUTE = 60_000_000_000;

export interface IWallClock {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
}

/** Decompose an instant into the wall-clock fields observed in `tz`. */
export function getWallClock(instant: number, tz: string): IWallClock {
  const z =
    Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
  return {
    year: z.year,
    month: z.month,
    day: z.day,
    hour: z.hour,
    minute: z.minute,
    second: z.second,
  };
}

/**
 * UTC offset in minutes that `tz` observes at `instant`.
 * Positive means ahead of UTC (e.g. Tokyo = +540).
 */
export function getOffsetMinutes(instant: number, tz: string): number {
  const z =
    Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
  return Math.round(z.offsetNanoseconds / NS_PER_MINUTE);
}

export interface IResolvedInstant {
  /** Epoch ms for the requested wall-clock time. */
  instant: number;
  /**
   * - "normal"    — the wall time exists exactly once
   * - "gap"       — the wall time was skipped (spring-forward)
   * - "ambiguous" — the wall time occurs twice (fall-back)
   */
  kind: "normal" | "gap" | "ambiguous";
  /** For "ambiguous": both candidate instants (earlier = DST, later = standard). */
  alternatives?: { earlier: number; later: number };
  /** For "gap": how far the requested time was pushed forward, in minutes. */
  shiftedByMinutes?: number;
}

function toPlainDateTime(w: IWallClock): Temporal.PlainDateTime {
  return new Temporal.PlainDateTime(
    w.year,
    w.month,
    w.day,
    w.hour,
    w.minute,
    w.second,
  );
}

/**
 * Invert a wall-clock time in `tz` back to an instant, classifying DST edges.
 *
 * `disambiguation: "reject"` throws precisely when the wall time is skipped or
 * repeated, which is how we detect gaps and overlaps; we then re-resolve with
 * explicit `earlier`/`later` to report the alternatives.
 */
export function resolveWallClock(
  w: IWallClock,
  tz: string,
  prefer: "earlier" | "later" = "earlier",
): IResolvedInstant {
  const pdt = toPlainDateTime(w);

  try {
    const exact = pdt.toZonedDateTime(tz, { disambiguation: "reject" });
    return { instant: exact.epochMilliseconds, kind: "normal" };
  } catch {
    // Either a gap or an overlap — distinguish by comparing the two readings.
    const earlier = pdt.toZonedDateTime(tz, { disambiguation: "earlier" });
    const later = pdt.toZonedDateTime(tz, { disambiguation: "later" });

    if (earlier.epochMilliseconds === later.epochMilliseconds) {
      // Same instant from both directions: nothing ambiguous after all.
      return { instant: earlier.epochMilliseconds, kind: "normal" };
    }

    // In a gap, "earlier" shifts back and "later" shifts forward, so neither
    // renders to the requested wall clock. In an overlap both do.
    const rendersAsRequested = (z: Temporal.ZonedDateTime) =>
      z.hour === w.hour && z.minute === w.minute && z.day === w.day;

    if (!rendersAsRequested(earlier) && !rendersAsRequested(later)) {
      const compatible = pdt.toZonedDateTime(tz, {
        disambiguation: "compatible",
      });
      const shifted = Math.abs(
        later.epochMilliseconds - earlier.epochMilliseconds,
      );
      return {
        instant: compatible.epochMilliseconds,
        kind: "gap",
        shiftedByMinutes: Math.round(shifted / 60_000),
      };
    }

    return {
      instant:
        prefer === "later"
          ? later.epochMilliseconds
          : earlier.epochMilliseconds,
      kind: "ambiguous",
      alternatives: {
        earlier: earlier.epochMilliseconds,
        later: later.epochMilliseconds,
      },
    };
  }
}

/** Short zone abbreviation, e.g. "PDT", "GMT+5:30". */
export function getZoneAbbreviation(instant: number, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date(instant));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** Long zone name, e.g. "Pacific Daylight Time". */
export function getZoneLongName(instant: number, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "long",
    }).formatToParts(new Date(instant));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** The zone's standard (non-DST) offset — the minimum offset across the year. */
export function getStandardOffsetMinutes(instant: number, tz: string): number {
  const z =
    Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
  let min = Infinity;
  for (let month = 1; month <= 12; month++) {
    const probe = z.with({ month, day: 1, hour: 12 });
    min = Math.min(min, Math.round(probe.offsetNanoseconds / NS_PER_MINUTE));
  }
  return min === Infinity ? getOffsetMinutes(instant, tz) : min;
}

/**
 * Whether `tz` is observing DST at `instant` — i.e. its current offset exceeds
 * its own standard (winter) offset.
 */
export function isDST(instant: number, tz: string): boolean {
  return getOffsetMinutes(instant, tz) > getStandardOffsetMinutes(instant, tz);
}

/** Whether the zone uses DST at all during the year containing `instant`. */
export function observesDST(instant: number, tz: string): boolean {
  const z =
    Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
  let min = Infinity;
  let max = -Infinity;
  for (let month = 1; month <= 12; month++) {
    const off = Math.round(
      z.with({ month, day: 1, hour: 12 }).offsetNanoseconds / NS_PER_MINUTE,
    );
    min = Math.min(min, off);
    max = Math.max(max, off);
  }
  return min !== max;
}

export interface ITransition {
  /** Instant at which the offset changes. */
  at: number;
  offsetBefore: number;
  offsetAfter: number;
  /** Positive = clocks spring forward, negative = clocks fall back. */
  deltaMinutes: number;
}

function toTransition(z: Temporal.ZonedDateTime): ITransition {
  const after = Math.round(z.offsetNanoseconds / NS_PER_MINUTE);
  const before = getOffsetMinutes(z.epochMilliseconds - 1000, z.timeZoneId);
  return {
    at: z.epochMilliseconds,
    offsetBefore: before,
    offsetAfter: after,
    deltaMinutes: after - before,
  };
}

/** The next DST transition strictly after `instant`, if any. */
export function getNextTransition(
  instant: number,
  tz: string,
): ITransition | null {
  try {
    const z =
      Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
    const next = z.getTimeZoneTransition("next");
    return next ? toTransition(next) : null;
  } catch {
    return null;
  }
}

/** The most recent DST transition before `instant`, if any. */
export function getPreviousTransition(
  instant: number,
  tz: string,
): ITransition | null {
  try {
    const z =
      Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
    const prev = z.getTimeZoneTransition("previous");
    return prev ? toTransition(prev) : null;
  } catch {
    return null;
  }
}

/** Upcoming transitions for `tz`, walking forward from `instant`. */
export function getUpcomingTransitions(
  instant: number,
  tz: string,
  count = 4,
): ITransition[] {
  const out: ITransition[] = [];
  try {
    let cur =
      Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
    for (let i = 0; i < count; i++) {
      const next = cur.getTimeZoneTransition("next");
      if (!next) break;
      out.push(toTransition(next));
      cur = next;
    }
  } catch {
    // Zone has no transition data — return whatever we gathered.
  }
  return out;
}

/** Format an offset in minutes as "+05:30" / "-08:00" / "+00:00". */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Format the difference between two zones, e.g. "3h 30m ahead". */
export function formatOffsetDifference(deltaMinutes: number): string {
  if (deltaMinutes === 0) return "Same time";
  const ahead = deltaMinutes > 0;
  const abs = Math.abs(deltaMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return `${parts.join(" ")} ${ahead ? "ahead" : "behind"}`;
}

export interface IFormatOptions {
  hour12: boolean;
  showSeconds: boolean;
  dateStyle: "short" | "medium" | "full";
}

/** Format an instant in a zone according to the user's display preferences. */
export function formatInZone(
  instant: number,
  tz: string,
  opts: IFormatOptions,
): { time: string; date: string; weekday: string } {
  const d = new Date(instant);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    ...(opts.showSeconds ? { second: "2-digit" as const } : {}),
    hour12: opts.hour12,
  }).format(d);

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    ...(opts.dateStyle === "short"
      ? { month: "short" as const, day: "numeric" as const }
      : opts.dateStyle === "medium"
        ? {
            month: "short" as const,
            day: "numeric" as const,
            year: "numeric" as const,
          }
        : {
            month: "long" as const,
            day: "numeric" as const,
            year: "numeric" as const,
          }),
  }).format(d);

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: opts.dateStyle === "short" ? "short" : "long",
  }).format(d);

  // Normalise the narrow no-break space some ICU builds emit before AM/PM.
  return { time: time.replace(/ /g, " "), date, weekday };
}

/** ISO 8601 string carrying the zone's local offset, e.g. 2026-07-25T09:30:00+05:30 */
export function toISOWithOffset(instant: number, tz: string): string {
  const z =
    Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(tz);
  const p = (n: number, len = 2) => String(Math.abs(n)).padStart(len, "0");
  return (
    `${p(z.year, 4)}-${p(z.month)}-${p(z.day)}` +
    `T${p(z.hour)}:${p(z.minute)}:${p(z.second)}${z.offset}`
  );
}

/** Day-difference of a zone's calendar date relative to a reference zone. */
export function getDayDifference(
  instant: number,
  tz: string,
  referenceTz: string,
): number {
  const a = Temporal.Instant.fromEpochMilliseconds(instant)
    .toZonedDateTimeISO(tz)
    .toPlainDate();
  const b = Temporal.Instant.fromEpochMilliseconds(instant)
    .toZonedDateTimeISO(referenceTz)
    .toPlainDate();
  return b.until(a).total({ unit: "day" });
}

export type DayPeriod = "night" | "early" | "work" | "evening";

/** Classify an hour into a coarse period, used for the meeting-planner heatmap. */
export function classifyHour(
  hour: number,
  workStart: number,
  workEnd: number,
): DayPeriod {
  if (hour >= workStart && hour < workEnd) return "work";
  if (hour >= 6 && hour < workStart) return "early";
  if (hour >= workEnd && hour < 22) return "evening";
  return "night";
}

/** Whether an instant falls on a Saturday or Sunday in the given zone. */
export function isWeekend(instant: number, tz: string): boolean {
  const dow =
    Temporal.Instant.fromEpochMilliseconds(instant).toZonedDateTimeISO(
      tz,
    ).dayOfWeek; // 1 = Monday … 7 = Sunday
  return dow === 6 || dow === 7;
}

/** Relative-time phrasing ("in 3 hours", "2 days ago"). */
export function getRelativeTime(instant: number, now: number): string {
  const diff = instant - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const MIN = 60_000;
  const HR = 3_600_000;
  const DAY = 86_400_000;

  if (abs < MIN) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < HR) return rtf.format(Math.round(diff / MIN), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / HR), "hour");
  if (abs < 30 * DAY) return rtf.format(Math.round(diff / DAY), "day");
  if (abs < 365 * DAY)
    return rtf.format(Math.round(diff / (30 * DAY)), "month");
  return rtf.format(Math.round(diff / (365 * DAY)), "year");
}

/** The viewer's own IANA zone. */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Whether a string is a zone identifier this runtime can resolve. */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export interface IParsedInput {
  instant: number;
  interpreted: string;
  /** Set when the input landed on a DST gap or overlap in the source zone. */
  resolution?: IResolvedInstant;
}

/**
 * Parse a range of user input into an instant, interpreting bare wall-clock
 * strings in `sourceTz`.
 */
export function parseFlexibleInput(
  raw: string,
  sourceTz: string,
  prefer: "earlier" | "later" = "earlier",
): IParsedInput | null {
  const input = raw.trim();
  if (!input) return null;

  // Unix timestamps (seconds or milliseconds)
  if (/^-?\d{9,}$/.test(input)) {
    const n = parseInt(input, 10);
    const isMs = Math.abs(n) >= 1e12;
    const instant = isMs ? n : n * 1000;
    if (!isNaN(instant)) {
      return {
        instant,
        interpreted: `Unix timestamp (${isMs ? "milliseconds" : "seconds"})`,
      };
    }
  }

  // Explicit offset or Z — absolute, zone-independent
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(input)) {
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return { instant: d.getTime(), interpreted: "ISO 8601 with offset" };
    }
  }

  // Bare wall clock: YYYY-MM-DD[ T]HH:MM[:SS]
  const m = input.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m) {
    const w: IWallClock = {
      year: +m[1],
      month: +m[2],
      day: +m[3],
      hour: m[4] ? +m[4] : 0,
      minute: m[5] ? +m[5] : 0,
      second: m[6] ? +m[6] : 0,
    };
    if (w.month < 1 || w.month > 12 || w.day < 1 || w.day > 31) return null;
    if (w.hour > 23 || w.minute > 59 || w.second > 59) return null;
    try {
      const resolution = resolveWallClock(w, sourceTz, prefer);
      return {
        instant: resolution.instant,
        interpreted: "Wall-clock time in source zone",
        resolution,
      };
    } catch {
      return null;
    }
  }

  // Anything else Date can handle (parsed as browser-local)
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    return {
      instant: d.getTime(),
      interpreted: "Parsed as browser-local time",
    };
  }

  return null;
}
