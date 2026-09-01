const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isoDate(year: number, month: number, day: number): string | null {
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function monthFromIso(iso: string): string {
  return iso.slice(0, 7);
}

/** Find "January 2026" / "Jan 2026" / "Statement Period: 01/01/2026" in header text. */
export function inferYearAndMonth(text: string, fallbackYear = 2026): { year: number; month: number | null } {
  const named = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{4})\b/i,
  );
  if (named) {
    const month = MONTHS[named[1].toLowerCase().replace(".", "")] ?? null;
    const year = Number(named[2]);
    if (month && year) return { year, month };
  }

  const iso = text.match(/\b(20\d{2})-(\d{2})\b/);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]) };

  const mdY = text.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (mdY) return { year: Number(mdY[3]), month: Number(mdY[1]) };

  const yearOnly = text.match(/\b(20\d{2})\b/);
  return { year: yearOnly ? Number(yearOnly[1]) : fallbackYear, month: null };
}

export type DateHit = { iso: string; raw: string; index: number };

export function firstDateInLine(line: string, defaultYear: number): DateHit | null {
  const mdY = line.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (mdY && mdY.index !== undefined) {
    let year = Number(mdY[3]);
    if (year < 100) year += 2000;
    const iso = isoDate(year, Number(mdY[1]), Number(mdY[2]));
    if (iso) return { iso, raw: mdY[0], index: mdY.index };
  }

  const ymd = line.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (ymd && ymd.index !== undefined) {
    const iso = isoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
    if (iso) return { iso, raw: ymd[0], index: ymd.index };
  }

  const named = line.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}|\d{4}))?\b/i,
  );
  if (named && named.index !== undefined) {
    const month = MONTHS[named[1].toLowerCase().replace(".", "")];
    const day = Number(named[2]);
    const year = named[3] ? Number(named[3]) : defaultYear;
    const iso = month ? isoDate(year, month, day) : null;
    if (iso) return { iso, raw: named[0], index: named.index };
  }

  return null;
}

export function looksLikeHeaderDateLine(line: string): boolean {
  return /^(date|datetime|posted|transaction date)\b/i.test(line.trim());
}
