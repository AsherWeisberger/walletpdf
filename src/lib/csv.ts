import type { Tx } from "./types";
import { OUTPUT_COLUMNS, QBO_COLUMNS } from "./types";
import { formatAmount } from "./money";

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toYtdCsv(rows: Tx[]): string {
  const header = OUTPUT_COLUMNS.join(",");
  const body = rows.map((row) =>
    [
      row.date,
      formatAmount(row.amount),
      row.direction,
      csvEscape(row.counterparty),
      csvEscape(row.note),
      row.source,
      row.statement_month,
      csvEscape(row.raw_line),
    ].join(","),
  );
  return [header, ...body].join("\n") + "\n";
}

export function toQboCsv(rows: Tx[]): string {
  const header = QBO_COLUMNS.join(",");
  const body = rows.map((row) => {
    const signed = row.direction === "out" ? -row.amount : row.amount;
    const [y, m, d] = row.date.split("-");
    const date = `${m}/${d}/${y}`;
    const descParts = [row.counterparty, row.note].filter(Boolean);
    const description = descParts.join(" — ") || row.source;
    return [date, csvEscape(description), signed.toFixed(2)].join(",");
  });
  return [header, ...body].join("\n") + "\n";
}

export function downloadBlob(filename: string, contents: string, mime = "text/csv;charset=utf-8"): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
