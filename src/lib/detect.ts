import type { Source } from "./types";

export type Detected = { source: Source | "unknown"; score: number };

export function detectSource(text: string, filename = ""): Detected {
  const t = `${filename}\n${text}`.toLowerCase();

  const scores: Record<Source, number> = {
    cashapp: 0,
    venmo: 0,
    paypal: 0,
    zelle: 0,
  };

  if (/\bcash app\b/.test(t) || /\bcashapp\b/.test(t)) scores.cashapp += 4;
  if (/\bcash card\b/.test(t)) scores.cashapp += 3;
  if (/\bsutton bank\b/.test(t)) scores.cashapp += 2;
  if (/\bcash app payment\b/.test(t)) scores.cashapp += 3;
  if (/cash_app|cash-app/.test(t)) scores.cashapp += 2;

  if (/\bvenmo\b/.test(t)) scores.venmo += 4;
  if (/\bvenmo debit\b/.test(t) || /\bvenmo card\b/.test(t)) scores.venmo += 2;
  if (/payment from |payment to /.test(t) && /\bvenmo\b/.test(t)) scores.venmo += 2;
  if (/amount \(total\)|statement period venmo/.test(t)) scores.venmo += 3;

  if (/\bpaypal\b/.test(t) || /\bpay pal\b/.test(t)) scores.paypal += 4;
  if (/name\s*\/\s*email/.test(t)) scores.paypal += 3;
  if (/\bgross\b/.test(t) && /\bfee\b/.test(t) && /\bnet\b/.test(t)) scores.paypal += 3;
  if (/payment received|express checkout/.test(t) && /\bpaypal\b/.test(t)) scores.paypal += 2;

  if (/\bzelle\b/.test(t)) scores.zelle += 4;
  if (/zelle from |zelle to |zelle payment/.test(t)) scores.zelle += 3;

  const ranked = (Object.entries(scores) as [Source, number][]).sort((a, b) => b[1] - a[1]);
  const [best, score] = ranked[0];
  if (score <= 0) return { source: "unknown", score: 0 };
  // Zelle often lives on a bank statement that also mentions other rails.
  if (best === "zelle" && score >= 3) return { source: "zelle", score };
  if (score >= 2) return { source: best, score };
  return { source: "unknown", score };
}

export function isLikelyScannedPdf(text: string, pageCount: number): boolean {
  const chars = text.replace(/\s+/g, "").length;
  if (pageCount <= 0) return true;
  const perPage = chars / pageCount;
  // Text-layer statements are chatty. Image-only scans yield almost nothing.
  return chars < 80 || perPage < 40;
}
