import { firstDateInLine, inferYearAndMonth, monthFromIso } from "../dates";
import { shouldSkipLine, splitLines, stitchRows, stripLeadingDate, cleanSpaces } from "../lines";
import { moneyTokens } from "../money";
import type { Tx } from "../types";

const DETAIL =
  /\b(cash app payment|cash card|direct deposit|atm(?: withdrawal)?|boost|bitcoin|cash app pay|payroll|instant deposit|cash out|support payment)\b/i;

function directionFrom(amountSigned: number, details: string, raw: string): "in" | "out" {
  if (amountSigned < 0) return "out";
  if (/[+]\$?\d/.test(raw) && amountSigned > 0) return "in";
  if (/direct deposit|payroll|payment received|money received|support payment/i.test(details)) {
    return "in";
  }
  if (/cash card|atm|cash out|bitcoin buy/i.test(details)) return "out";
  // Unsigned Cash App payments are sends; a leading + marks receives.
  return amountSigned > 0 && /\+\s*\$/.test(raw) ? "in" : "out";
}

export function parseCashApp(text: string, statementHint?: string): Tx[] {
  const { year } = inferYearAndMonth(`${statementHint ?? ""}\n${text}`);
  const lines = stitchRows(splitLines(text));
  const rows: Tx[] = [];

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;
    const date = firstDateInLine(line, year);
    if (!date) continue;
    // Cash App rows start with the date.
    if (date.index > 3) continue;

    const tokens = moneyTokens(line);
    if (tokens.length === 0) continue;

    // Last money token is the transaction amount. A preceding $x.xx is the fee.
    const amountTok = tokens[tokens.length - 1];
    const rest = stripLeadingDate(line, date.raw);
    const withoutAmount = rest.slice(0, Math.max(0, amountTok.index - date.raw.length - 1)).trim();

    const detailMatch = withoutAmount.match(DETAIL);
    const details = detailMatch ? detailMatch[1] : "";
    let counterparty = withoutAmount;
    if (detailMatch && detailMatch.index !== undefined) {
      counterparty = withoutAmount.slice(0, detailMatch.index).trim();
      // Drop a trailing fee token from the counterparty/details region.
    }
    counterparty = counterparty
      .replace(/\$\d[\d,]*\.\d{2}\s*$/g, "")
      .replace(/\bfee\b/gi, "")
      .trim();

    const note = cleanSpaces([details, tokens.length >= 2 ? `fee ${tokens[tokens.length - 2].raw}` : ""]
      .filter(Boolean)
      .join(" "));

    // Skip summary lines that snuck through ("Money In + $2,450.00").
    if (/^(money in|money out|fees|change this month)\b/i.test(counterparty)) continue;

    const signedHint =
      /[+]/.test(amountTok.raw) ? amountTok.value : /[-−–(]/.test(amountTok.raw) ? -amountTok.value : amountTok.signed;

    const direction = directionFrom(signedHint === 0 ? amountTok.signed : signedHint, details, line);

    rows.push({
      date: date.iso,
      amount: amountTok.value,
      direction,
      counterparty: cleanSpaces(counterparty) || "Cash App",
      note,
      source: "cashapp",
      statement_month: monthFromIso(date.iso),
      raw_line: line,
    });
  }

  return rows;
}
