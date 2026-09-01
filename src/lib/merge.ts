import type { FileParseResult, MergeResult, Tx } from "./types";

function rowKey(row: Tx): string {
  return [
    row.date,
    row.amount.toFixed(2),
    row.direction,
    row.counterparty.toLowerCase(),
    row.note.toLowerCase(),
    row.source,
    row.raw_line.trim().toLowerCase(),
  ].join("|");
}

export function mergeResults(files: FileParseResult[]): MergeResult {
  const seen = new Set<string>();
  const rows: Tx[] = [];
  let duplicatesRemoved = 0;

  for (const file of files) {
    for (const row of file.rows) {
      const key = rowKey(row);
      if (seen.has(key)) {
        duplicatesRemoved += 1;
        continue;
      }
      seen.add(key);
      rows.push(row);
    }
  }

  rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.source !== b.source) return a.source < b.source ? -1 : 1;
    return a.raw_line.localeCompare(b.raw_line);
  });

  return { rows, duplicatesRemoved, files };
}

export function totals(rows: Tx[]): { inn: number; out: number; net: number; count: number } {
  let inn = 0;
  let out = 0;
  for (const row of rows) {
    if (row.direction === "in") inn += row.amount;
    else out += row.amount;
  }
  inn = Math.round(inn * 100) / 100;
  out = Math.round(out * 100) / 100;
  return { inn, out, net: Math.round((inn - out) * 100) / 100, count: rows.length };
}
