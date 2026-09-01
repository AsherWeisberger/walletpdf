const MONEY_RE =
  /([+\-−–]?\(?\$?-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?|[+\-−–]?\(?\$?-?\$?\d+\.\d{2}\)?)/g;

export function parseMoneyToken(raw: string): { value: number; signed: number } | null {
  const compact = raw.replace(/[$,\s]/g, "").replace(/[−–]/g, "-");
  const parenNeg = /^\(.*\)$/.test(compact);
  const n = Number(compact.replace(/[()]/g, ""));
  if (!Number.isFinite(n)) return null;
  const signed = parenNeg ? -Math.abs(n) : n;
  return { value: Math.abs(signed), signed };
}

export function moneyTokens(line: string): { raw: string; value: number; signed: number; index: number }[] {
  const out: { raw: string; value: number; signed: number; index: number }[] = [];
  for (const match of line.matchAll(MONEY_RE)) {
    const raw = match[0];
    const parsed = parseMoneyToken(raw);
    if (!parsed) continue;
    // Skip bare years and page-looking integers without cents when they
    // are not clearly money. Require a decimal OR a $ / sign / paren.
    const looksMoney =
      raw.includes(".") ||
      raw.includes("$") ||
      /[+\-−–()]/.test(raw) ||
      /\d{1,3}(?:,\d{3})+/.test(raw);
    if (!looksMoney) continue;
    out.push({ raw, value: parsed.value, signed: parsed.signed, index: match.index ?? 0 });
  }
  return out;
}

export function formatAmount(n: number): string {
  return n.toFixed(2);
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
