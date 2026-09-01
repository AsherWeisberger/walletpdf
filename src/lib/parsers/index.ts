import { detectSource, isLikelyScannedPdf } from "../detect";
import type { FileParseResult, Source, Tx } from "../types";
import { parseCashApp } from "./cashapp";
import { parseGeneric } from "./generic";
import { parsePayPal } from "./paypal";
import { parseVenmo } from "./venmo";
import { parseZelle } from "./zelle";
import { moneyTokens } from "../money";
import { firstDateInLine } from "../dates";
import { splitLines, stitchRows } from "../lines";

export { parseCashApp, parseVenmo, parsePayPal, parseZelle, parseGeneric };

const SCANNED_MESSAGE =
  "This looks like a scanned PDF with no selectable text layer. Export a text/CSV from the app if you can, then drop that file here. WalletPDF does not run cloud OCR.";

function parseForSource(source: Source, text: string, filename: string): Tx[] {
  switch (source) {
    case "cashapp":
      return parseCashApp(text, filename);
    case "venmo":
      return parseVenmo(text, filename);
    case "paypal":
      return parsePayPal(text, filename);
    case "zelle":
      return parseZelle(text, filename);
  }
}

function candidateLineCount(text: string): number {
  return stitchRows(splitLines(text)).filter((line) => {
    const date = firstDateInLine(line, 2026);
    return Boolean(date && moneyTokens(line).length > 0);
  }).length;
}

export function confidenceFor(rows: number, candidates: number, sourceKnown: boolean): number {
  if (rows <= 0) return 0;
  const ratio = candidates > 0 ? rows / candidates : 1;
  let c = Math.min(1, 0.35 + ratio * 0.55 + (sourceKnown ? 0.1 : 0));
  if (rows >= 4 && ratio >= 0.6) c = Math.max(c, 0.82);
  if (rows >= 1 && ratio < 0.35) c = Math.min(c, 0.55);
  return Math.round(c * 100) / 100;
}

export function parseExtractedText(opts: {
  text: string;
  filename: string;
  pageCount: number;
}): FileParseResult {
  const { text, filename, pageCount } = opts;
  const textChars = text.replace(/\s+/g, "").length;

  if (isLikelyScannedPdf(text, pageCount) || textChars < 40) {
    return {
      filename,
      source: "unknown",
      rows: [],
      confidence: 0,
      pageCount,
      textChars,
      issue: { code: "scanned", message: SCANNED_MESSAGE },
    };
  }

  const detected = detectSource(text, filename);
  let source: Source | "unknown" = detected.source;
  let rows: Tx[] = [];

  if (source !== "unknown") {
    rows = parseForSource(source, text, filename);
    if (rows.length === 0) {
      rows = parseGeneric(text, source, filename);
    }
  } else {
    // Try each branded parser; pick the one that yields the most rows.
    const attempts: { source: Source; rows: Tx[] }[] = [
      { source: "cashapp", rows: parseCashApp(text, filename) },
      { source: "venmo", rows: parseVenmo(text, filename) },
      { source: "paypal", rows: parsePayPal(text, filename) },
      { source: "zelle", rows: parseZelle(text, filename) },
    ];
    attempts.sort((a, b) => b.rows.length - a.rows.length);
    if (attempts[0].rows.length > 0) {
      source = attempts[0].source;
      rows = attempts[0].rows;
    }
  }

  if (rows.length === 0) {
    return {
      filename,
      source,
      rows: [],
      confidence: 0,
      pageCount,
      textChars,
      issue: {
        code: source === "unknown" ? "unknown_source" : "no_rows",
        message:
          source === "unknown"
            ? "Could not tell if this is a Cash App, Venmo, PayPal, or Zelle statement. Check /how for the download path, and make sure the PDF has selectable text."
            : "Detected a statement but found no transaction rows. If this is a summary-only PDF, download the full monthly statement.",
      },
    };
  }

  const candidates = Math.max(rows.length, candidateLineCount(text));
  return {
    filename,
    source,
    rows,
    confidence: confidenceFor(rows.length, candidates, source !== "unknown"),
    pageCount,
    textChars,
  };
}
