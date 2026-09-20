import { describe, expect, it } from "vitest";
import {
  clinicDayRangeUtc,
  clinicLocalToUtc,
  utcToClinicParts,
} from "@/lib/timezone";

describe("clinic timezone helpers", () => {
  it("round-trips a clinic-local wall clock through UTC", () => {
    const utc = clinicLocalToUtc("2026-01-15", "12:00", "Africa/Cairo");
    expect(utcToClinicParts(utc, "Africa/Cairo")).toEqual({
      date: "2026-01-15",
      time: "12:00",
    });
  });

  it("keeps 00:30 and 23:30 on the selected Cairo calendar day", () => {
    const { start, end } = clinicDayRangeUtc("2026-01-15", "Africa/Cairo");
    const early = clinicLocalToUtc("2026-01-15", "00:30", "Africa/Cairo");
    const late = clinicLocalToUtc("2026-01-15", "23:30", "Africa/Cairo");
    const nextMidnight = clinicLocalToUtc("2026-01-16", "00:00", "Africa/Cairo");

    expect(early.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(early.getTime()).toBeLessThan(end.getTime());
    expect(late.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(late.getTime()).toBeLessThan(end.getTime());
    expect(nextMidnight.getTime()).toBe(end.getTime());
  });
});
