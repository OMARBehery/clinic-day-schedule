import { TZDate } from "@date-fns/tz";

export const DEFAULT_CLINIC_TIMEZONE = "Africa/Cairo";

export function getClinicTimezone() {
  const value = (
    process.env.CLINIC_TIMEZONE ||
    process.env.NEXT_PUBLIC_CLINIC_TIMEZONE ||
    DEFAULT_CLINIC_TIMEZONE
  ).trim();
  return value || DEFAULT_CLINIC_TIMEZONE;
}

export function parseYearMonthDay(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`Invalid calendar date: ${date}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** Inclusive start / exclusive end of a clinic-local calendar day, as UTC Date instants. */
export function clinicDayRangeUtc(
  date: string,
  timeZone = getClinicTimezone(),
) {
  const { year, month, day } = parseYearMonthDay(date);
  const start = new TZDate(year, month - 1, day, 0, 0, 0, 0, timeZone);
  const end = new TZDate(year, month - 1, day + 1, 0, 0, 0, 0, timeZone);
  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}

export function clinicLocalToUtc(
  date: string,
  time: string,
  timeZone = getClinicTimezone(),
) {
  const { year, month, day } = parseYearMonthDay(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!timeMatch) {
    throw new Error(`Invalid time: ${time}`);
  }
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const local = new TZDate(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0,
    timeZone,
  );
  return new Date(local.getTime());
}

export function utcToClinicParts(
  instant: Date,
  timeZone = getClinicTimezone(),
) {
  const zoned = new TZDate(instant, timeZone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`,
    time: `${pad(zoned.getHours())}:${pad(zoned.getMinutes())}`,
  };
}

export function todayInClinic(timeZone = getClinicTimezone()) {
  return utcToClinicParts(new Date(), timeZone).date;
}

export function addMinutes(instant: Date, minutes: number) {
  return new Date(instant.getTime() + minutes * 60_000);
}
