import { firstDateInLine, inferYearAndMonth, monthFromIso } from "../dates";
import { shouldSkipLine, splitLines, stitchRows, stripLeadingDate, cleanSpaces } from "../lines";
import { moneyTokens } from "../money";
import type { Tx } from "../types";

/**
 * Zelle does not issue its own monthly PDF. Transactions show up on the
 * bank/credit-union statement, usually labeled ZELLE / Zelle payment.
 * We keep only those rows so a mixed checking statement does not dump every POS purchase.
 */
export function parseZelle(text: string, statementHint?: string): Tx[] {
  const { year } = inferYearAndMonth(`${statementHint ?? ""}\n${text}`);
  const lines = stitchRows(splitLines(text));
  const rows: Tx[] = [];

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;
    if (!/\bzelle\b/i.test(line)) continue;
    const date = firstDateInLine(line, year);
    if (!date) continue;
    const tokens = moneyTokens(line);
    if (tokens.length === 0) continue;

    // Bank tables: Date Description Debit Credit Balance
    // Debit and credit are mutually exclusive; last token is often running balance.
    let amountTok = tokens[0];
    let direction: "in" | "out" = "out";

    const fromLike = /zelle(?: payment)?(?: send)? from\b|zelle from\b|received via zelle|zelle credit/i.test(line);
    const toLike = /zelle(?: payment)?(?: send)? to\b|zelle to\b|sent via zelle|zelle debit/i.test(line);

    if (tokens.length >= 2) {
      // Prefer a non-balance token: if two amounts, first is debit/credit, last is balance.
      amountTok = tokens[0];
    }

    if (fromLike) direction = "in";
    else if (toLike) direction = "out";
    else if (amountTok.signed < 0) direction = "out";
    else if (amountTok.signed > 0 && /[+]/.test(amountTok.raw)) direction = "in";
    else {
      // Some banks put credits in a right-hand column. If the money token sits
      // far to the right of "Zelle" and there is no "to", treat as in.
      direction = fromLike ? "in" : "out";
    }

    const rest = stripLeadingDate(line, date.raw);
    let counterparty = rest
      .replace(/\bzelle(?:\s+payment)?(?:\s+send)?/gi, " ")
      .replace(/\b(from|to|via)\b/gi, " ")
      .replace(/\$?[\d,]+\.\d{2}/g, " ")
      .replace(/\b(debit|credit|ach|web|mobile|p2p)\b/gi, " ");
    counterparty = cleanSpaces(counterparty);

    const note = fromLike ? "Zelle from" : toLike ? "Zelle to" : "Zelle";

    rows.push({
      date: date.iso,
      amount: amountTok.value,
      direction,
      counterparty: counterparty || "Zelle",
      note,
      source: "zelle",
      statement_month: monthFromIso(date.iso),
      raw_line: line,
    });
  }

  return rows;
}
