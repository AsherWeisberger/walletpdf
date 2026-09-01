export type Source = "cashapp" | "venmo" | "paypal" | "zelle";

export type Direction = "in" | "out";

export type Tx = {
  date: string; // YYYY-MM-DD
  amount: number; // always unsigned, two-decimal money
  direction: Direction;
  counterparty: string;
  note: string;
  source: Source;
  statement_month: string; // YYYY-MM
  raw_line: string;
};

export type ParseIssue = {
  code: "scanned" | "empty" | "no_rows" | "unknown_source";
  message: string;
};

export type FileParseResult = {
  filename: string;
  source: Source | "unknown";
  rows: Tx[];
  confidence: number; // 0..1
  pageCount: number;
  textChars: number;
  issue?: ParseIssue;
};

export type MergeResult = {
  rows: Tx[];
  duplicatesRemoved: number;
  files: FileParseResult[];
};

export const OUTPUT_COLUMNS = [
  "date",
  "amount",
  "direction",
  "counterparty",
  "note",
  "source",
  "statement_month",
  "raw_line",
] as const;

export const QBO_COLUMNS = ["Date", "Description", "Amount"] as const;

export const PREVIEW_LIMIT = 5;

export const PRICE_USD = 19;
export const PRODUCT_NAME = "2026 YTD pack";
export const UNLOCK_STORAGE_KEY = "walletpdf_unlocked";
