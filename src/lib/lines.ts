const SKIP =
  /^(page\s+\d+|all transactions shown|confidential|member fdic|questions\?|for more information|beginning balance|ending balance|balance on |money in|money out|fees\s+\$|available beginning|available ending|transaction history|activity summary|statement period|account ending|account number|routing number|sutton bank|cash app investing)/i;

export function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

export function splitLines(text: string): string[] {
  return normalizeText(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function shouldSkipLine(line: string): boolean {
  if (line.length < 4) return true;
  if (SKIP.test(line)) return true;
  if (/^date\s+description/i.test(line)) return true;
  if (/^date\s+time/i.test(line)) return true;
  return false;
}

/**
 * PDF.js often splits a table row across several items. If a line is a bare
 * date, stitch following lines until we hit an amount.
 */
export function stitchRows(lines: string[]): string[] {
  const out: string[] = [];
  const dateStart =
    /^(?:\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}|20\d{2}-\d{2}-\d{2})\b/i;
  const hasAmount = /\$?\d{1,3}(?:,\d{3})*\.\d{2}|\(\$?\d+\.\d{2}\)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (dateStart.test(line) && !hasAmount.test(line)) {
      const parts = [line];
      let j = i + 1;
      while (j < lines.length && j <= i + 6 && !dateStart.test(lines[j])) {
        parts.push(lines[j]);
        if (hasAmount.test(lines[j])) {
          j += 1;
          break;
        }
        j += 1;
      }
      out.push(parts.join(" "));
      i = j - 1;
      continue;
    }
    out.push(line);
  }
  return out;
}

export function stripLeadingDate(line: string, rawDate: string): string {
  const idx = line.indexOf(rawDate);
  if (idx === -1) return line.trim();
  return line.slice(idx + rawDate.length).trim();
}

export function cleanSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
