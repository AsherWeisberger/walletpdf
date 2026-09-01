import { firstDateInLine, inferYearAndMonth, monthFromIso } from "../dates";
import { shouldSkipLine, splitLines, stitchRows, stripLeadingDate, cleanSpaces } from "../lines";
import { moneyTokens } from "../money";
import type { Tx } from "../types";

const FROM_TO =
  /(?:payment|charge|request completed)?\s*(?:from|to)\s+([^+\-−–$]+?)(?:\s[-–—]\s|\s{2,}|$)/i;

function parseVenmoCsvLike(text: string): Tx[] | null {
  const lines = splitLines(text);
  const headerIdx = lines.findIndex((l) => /datetime/i.test(l) && /amount \(total\)/i.test(l));
  if (headerIdx === -1) return null;
  const header = lines[headerIdx].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.findIndex((h) => h === name || h.startsWith(name));
  const iDate = idx("datetime") >= 0 ? idx("datetime") : idx("date");
  const iType = idx("type");
  const iNote = idx("note");
  const iFrom = idx("from");
  const iTo = idx("to");
  const iAmount = header.findIndex((h) => h.includes("amount (total)") || h === "amount");
  if (iDate < 0 || iAmount < 0) return null;

  const rows: Tx[] = [];
  for (const line of lines.slice(headerIdx + 1)) {
    if (!line.includes(",")) continue;
    const cols = line.split(",").map((c) => c.trim());
    const date = firstDateInLine(cols[iDate] ?? "", 2026);
    const amountTok = moneyTokens(cols[iAmount] ?? "")[0];
    if (!date || !amountTok) continue;
    const type = (cols[iType] ?? "").toLowerCase();
    const from = cols[iFrom] ?? "";
    const to = cols[iTo] ?? "";
    const note = cols[iNote] ?? "";
    const direction: "in" | "out" =
      amountTok.signed < 0 || /payment.*sent|charge|withdrawal|transfer.*bank/.test(type)
        ? "out"
        : amountTok.signed > 0 || /payment.*received|deposit|standard transfer/.test(type)
          ? "in"
          : amountTok.signed < 0
            ? "out"
            : "in";
    // Counterparty is the other party.
    const counterparty = cleanSpaces(direction === "in" ? from || to : to || from);
    rows.push({
      date: date.iso,
      amount: amountTok.value,
      direction: amountTok.signed < 0 ? "out" : amountTok.signed > 0 ? "in" : direction,
      counterparty: counterparty || "Venmo",
      note: cleanSpaces([type, note].filter(Boolean).join(" — ")),
      source: "venmo",
      statement_month: monthFromIso(date.iso),
      raw_line: line,
    });
  }
  return rows;
}

export function parseVenmo(text: string, statementHint?: string): Tx[] {
  const csv = parseVenmoCsvLike(text);
  if (csv && csv.length > 0) return csv;

  const { year } = inferYearAndMonth(`${statementHint ?? ""}\n${text}`);
  const lines = stitchRows(splitLines(text));
  const rows: Tx[] = [];

  for (const line of lines) {
    if (shouldSkipLine(line)) continue;
    if (/^venmo statement\b/i.test(line)) continue;
    const date = firstDateInLine(line, year);
    if (!date || date.index > 3) continue;
    const tokens = moneyTokens(line);
    if (tokens.length === 0) continue;

    // Description, signed amount, optional running balance.
    let amountTok = tokens[0];
    if (tokens.length >= 2) {
      // Prefer the token that still has an explicit sign; last is often balance.
      const signed = tokens.filter((t) => /[+\-−–(]/.test(t.raw));
      amountTok = signed[0] ?? tokens[tokens.length - 2] ?? tokens[0];
    }

    const rest = stripLeadingDate(line, date.raw);
    const restNoMoney = rest.replace(amountTok.raw, " ").replace(/\$[\d,]+\.\d{2}/g, " ");
    const fromTo = rest.match(FROM_TO);
    let counterparty = fromTo ? fromTo[1] : "";
    let note = "";

    if (/venmo debit card|venmo card/i.test(rest)) {
      counterparty = restNoMoney
        .replace(/venmo debit card\s*-?\s*/i, "")
        .replace(/venmo card\s*-?\s*/i, "")
        .trim();
      note = "Venmo Debit Card";
    } else if (/transfer to bank|standard transfer|instant transfer/i.test(rest)) {
      counterparty = "Bank transfer";
      note = cleanSpaces(restNoMoney);
    } else if (fromTo) {
      const dash = rest.split(/\s[-–—]\s/);
      note = dash.length > 1 ? cleanSpaces(dash.slice(1).join(" — ").replace(/[+\-−–$][\d,]+\.\d{2}.*/g, "")) : "";
    } else {
      counterparty = cleanSpaces(restNoMoney);
    }

    const direction: "in" | "out" =
      amountTok.signed < 0 || /payment to |charge to |transfer to bank/i.test(line)
        ? "out"
        : amountTok.signed > 0 || /payment from |charge from |transfer from/i.test(line)
          ? "in"
          : /payment to /i.test(line)
            ? "out"
            : "in";

    rows.push({
      date: date.iso,
      amount: amountTok.value,
      direction,
      counterparty: cleanSpaces(counterparty) || "Venmo",
      note,
      source: "venmo",
      statement_month: monthFromIso(date.iso),
      raw_line: line,
    });
  }

  return rows;
}
