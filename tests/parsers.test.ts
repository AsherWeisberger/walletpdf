import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseExtractedText } from "../src/lib/parsers/index";
import { parseCashApp } from "../src/lib/parsers/cashapp";
import { parseVenmo } from "../src/lib/parsers/venmo";
import { parsePayPal } from "../src/lib/parsers/paypal";
import { parseZelle } from "../src/lib/parsers/zelle";
import { mergeResults } from "../src/lib/merge";
import { toQboCsv, toYtdCsv } from "../src/lib/csv";
import { PREVIEW_LIMIT, type FileParseResult } from "../src/lib/types";
import { shouldUnlockFromQuery } from "../src/lib/unlock";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = (name: string) =>
  readFileSync(join(root, "src", "fixtures", name), "utf8");

describe("Cash App parser", () => {
  const text = fixture("cashapp.txt");
  const rows = parseCashApp(text);

  it("extracts every transaction row", () => {
    assert.equal(rows.length, 7);
  });

  it("treats +amounts as money in", () => {
    const jordan = rows.find((r) => /jordan lee/i.test(r.counterparty));
    assert.ok(jordan);
    assert.equal(jordan!.direction, "in");
    assert.equal(jordan!.amount, 850);
    assert.equal(jordan!.date, "2026-01-03");
    assert.equal(jordan!.source, "cashapp");
  });

  it("treats Cash Card spend as money out", () => {
    const acme = rows.find((r) => /acme hardware/i.test(r.counterparty));
    assert.ok(acme);
    assert.equal(acme!.direction, "out");
    assert.equal(acme!.amount, 42.18);
  });

  it("keeps ATM and payroll", () => {
    assert.ok(rows.some((r) => r.amount === 102.5 && r.direction === "out"));
    assert.ok(rows.some((r) => r.amount === 1200 && r.direction === "in"));
  });
});

describe("Venmo parser", () => {
  const text = fixture("venmo.txt");
  const rows = parseVenmo(text);

  it("extracts every transaction row", () => {
    assert.equal(rows.length, 7);
  });

  it("reads payment from / payment to counterparties", () => {
    const alex = rows.find((r) => /alex chen/i.test(r.counterparty));
    assert.ok(alex);
    assert.equal(alex!.direction, "in");
    assert.equal(alex!.amount, 1200);
    assert.match(alex!.note, /studio rent/i);

    const pat = rows.find((r) => /pat singh/i.test(r.counterparty));
    assert.ok(pat);
    assert.equal(pat!.direction, "out");
    assert.equal(pat!.amount, 86.5);
  });

  it("tags card spend and bank transfers", () => {
    const card = rows.find((r) => /shell oil/i.test(r.counterparty));
    assert.ok(card);
    assert.equal(card!.direction, "out");
    const xfer = rows.find((r) => /bank transfer/i.test(r.counterparty));
    assert.ok(xfer);
    assert.equal(xfer!.amount, 800);
    assert.equal(xfer!.direction, "out");
  });
});

describe("PayPal parser", () => {
  const rows = parsePayPal(fixture("paypal.txt"));
  it("extracts transaction history rows", () => {
    assert.equal(rows.length, 6);
  });
  it("uses Net amount and inbound/outbound type", () => {
    const north = rows.find((r) => /north studio/i.test(r.counterparty));
    assert.ok(north);
    assert.equal(north!.direction, "in");
    assert.equal(north!.amount, 1456.2);
    const adobe = rows.find((r) => /adobe/i.test(r.counterparty));
    assert.ok(adobe);
    assert.equal(adobe!.direction, "out");
  });
});

describe("Zelle parser", () => {
  const rows = parseZelle(fixture("zelle.txt"));
  it("keeps only Zelle-labeled bank lines", () => {
    assert.equal(rows.length, 5);
    assert.ok(rows.every((r) => r.source === "zelle"));
    assert.ok(!rows.some((r) => /grocery|payroll/i.test(r.raw_line)));
  });
  it("maps FROM as in and TO as out", () => {
    const casey = rows.find((r) => /casey brooks/i.test(r.counterparty));
    assert.ok(casey);
    assert.equal(casey!.direction, "in");
    assert.equal(casey!.amount, 600);
    const marcus = rows.find((r) => /marcus hill/i.test(r.counterparty));
    assert.ok(marcus);
    assert.equal(marcus!.direction, "out");
  });
});

describe("end-to-end extract + preview + export", () => {
  function fileOf(name: string, text: string): FileParseResult {
    return parseExtractedText({ text, filename: name, pageCount: 2 });
  }

  it("detects sources and reports confidence plus row counts", () => {
    const cash = fileOf("CashApp-Jan-2026.pdf", fixture("cashapp.txt"));
    const venmo = fileOf("Venmo-Mar-2026.pdf", fixture("venmo.txt"));
    assert.equal(cash.source, "cashapp");
    assert.equal(venmo.source, "venmo");
    assert.ok(cash.rows.length >= 5);
    assert.ok(venmo.rows.length >= 5);
    assert.ok(cash.confidence >= 0.7);
    assert.ok(venmo.confidence >= 0.7);
    assert.equal(cash.issue, undefined);
  });

  it("free preview is the first 5 merged rows; full YTD has every row", () => {
    const merged = mergeResults([
      fileOf("CashApp-Jan-2026.pdf", fixture("cashapp.txt")),
      fileOf("Venmo-Mar-2026.pdf", fixture("venmo.txt")),
    ]);
    const preview = merged.rows.slice(0, PREVIEW_LIMIT);
    assert.equal(preview.length, PREVIEW_LIMIT);
    assert.ok(merged.rows.length > PREVIEW_LIMIT);
    // Sorted by date: Cash App January before Venmo March.
    assert.ok(merged.rows[0].date.startsWith("2026-01"));
    assert.ok(merged.rows[merged.rows.length - 1].date.startsWith("2026-03"));
  });

  it("full export with ?unlock=dev includes stable columns and a QBO file", () => {
    assert.equal(shouldUnlockFromQuery("?unlock=dev"), true);
    assert.equal(shouldUnlockFromQuery(""), false);

    const merged = mergeResults([
      fileOf("CashApp-Jan-2026.pdf", fixture("cashapp.txt")),
      fileOf("Venmo-Mar-2026.pdf", fixture("venmo.txt")),
    ]);
    const ytd = toYtdCsv(merged.rows);
    const qbo = toQboCsv(merged.rows);
    const header = ytd.split("\n")[0];
    assert.equal(
      header,
      "date,amount,direction,counterparty,note,source,statement_month,raw_line",
    );
    const ytdLines = ytd.trim().split("\n");
    assert.equal(ytdLines.length, merged.rows.length + 1);
    assert.equal(qbo.split("\n")[0], "Date,Description,Amount");
    assert.match(qbo, /\d{2}\/\d{2}\/\d{4},/);
    // Money out is negative in the QBO amount column.
    assert.match(qbo, /,-/);
  });

  it("de-dupes exact duplicate rows across overlapping PDFs", () => {
    const a = fileOf("a.pdf", fixture("cashapp.txt"));
    const b = fileOf("b.pdf", fixture("cashapp.txt"));
    const merged = mergeResults([a, b]);
    assert.equal(merged.rows.length, a.rows.length);
    assert.equal(merged.duplicatesRemoved, a.rows.length);
  });

  it("surfaces a scanned-PDF error instead of silently failing", () => {
    const scanned = parseExtractedText({
      text: fixture("scanned.txt"),
      filename: "scan.pdf",
      pageCount: 3,
    });
    assert.equal(scanned.rows.length, 0);
    assert.equal(scanned.issue?.code, "scanned");
    assert.match(scanned.issue?.message ?? "", /scanned PDF/i);
    assert.match(scanned.issue?.message ?? "", /export a text\/CSV/i);
  });
});
