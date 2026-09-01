import { firstDateInLine, inferYearAndMonth, monthFromIso } from "../dates";
import { shouldSkipLine, splitLines, stitchRows, stripLeadingDate, cleanSpaces } from "../lines";
import { moneyTokens } from "../money";
import type { Tx } from "../types";

const TYPE =
  /\b(payment received|payments received|payment sent|payments sent|express checkout payment|withdrawal to bank|general withdrawal|general credit|general debit|refund|chargeback|fee|preapproved payment|mobile payment|invoice payment|donation received|subscription payment)\b/i;

function paypalDirection(type: string, signed: number): "in" | "out" {
  if (/received|credit|refund/.test(type) && !/sent/.test(type)) return "in";
  if (/sent|withdrawal|debit|fee|checkout|preapproved/.test(type)) return "out";
  return signed < 0 ? "out" : "in";
}

export function parsePayPal(text: string, statementHint?: string): Tx[] {
  const { year } = inferYearAndMonth(`${statementHint ?? ""}\n${text}`);
  const lines = stitchRows(splitLines(text));
  const rows: Tx[] = [];

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;
    const date = firstDateInLine(line, year);
    if (!date || date.index > 3) continue;
    const tokens = moneyTokens(line);
    if (tokens.length === 0) continue;

    // Date | Description | Name/Email | Gross | Fee | Net  (Net last)
    const net = tokens[tokens.length - 1];
    const typeMatch = line.match(TYPE);
    const type = typeMatch ? typeMatch[1].toLowerCase() : "";

    const rest = stripLeadingDate(line, date.raw);
    let working = rest;
    if (typeMatch) working = working.replace(typeMatch[0], " ");
    for (const tok of tokens) working = working.replace(tok.raw, " ");
    working = working.replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim();

    // Name / Email often looks like "North Studio / billing@north.com"
    let counterparty = working;
    let note = type;
    const emailSplit = working.split(" / ");
    if (emailSplit.length >= 2 && /@/.test(emailSplit[emailSplit.length - 1])) {
      counterparty = emailSplit.slice(0, -1).join(" / ").trim();
      note = cleanSpaces([type, emailSplit[emailSplit.length - 1]].filter(Boolean).join(" — "));
    }

    const signed = net.signed !== 0 ? net.signed : tokens[0].signed;
    const direction = paypalDirection(type, signed);

    rows.push({
      date: date.iso,
      amount: Math.abs(net.value),
      direction,
      counterparty: cleanSpaces(counterparty) || "PayPal",
      note,
      source: "paypal",
      statement_month: monthFromIso(date.iso),
      raw_line: line,
    });
  }

  return rows;
}
