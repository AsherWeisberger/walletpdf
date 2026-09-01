import { firstDateInLine, inferYearAndMonth, monthFromIso } from "../dates";
import { shouldSkipLine, splitLines, stitchRows, stripLeadingDate, cleanSpaces } from "../lines";
import { moneyTokens } from "../money";
import type { Source, Tx } from "../types";

/** Last-resort row finder when a branded parser returned nothing. */
export function parseGeneric(text: string, source: Source, statementHint?: string): Tx[] {
  const { year } = inferYearAndMonth(`${statementHint ?? ""}\n${text}`);
  const lines = stitchRows(splitLines(text));
  const rows: Tx[] = [];

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;
    const date = firstDateInLine(line, year);
    if (!date) continue;
    const tokens = moneyTokens(line);
    if (tokens.length === 0) continue;
    const amountTok = tokens[tokens.length >= 2 ? tokens.length - 2 : 0];
    const rest = stripLeadingDate(line, date.raw).replace(/\$?[\d,]+\.\d{2}/g, " ");
    const direction: "in" | "out" = amountTok.signed < 0 || /payment to |withdraw|debit|sent/i.test(line) ? "out" : "in";
    rows.push({
      date: date.iso,
      amount: amountTok.value,
      direction,
      counterparty: cleanSpaces(rest) || source,
      note: "generic",
      source,
      statement_month: monthFromIso(date.iso),
      raw_line: line,
    });
  }
  return rows;
}
