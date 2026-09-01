"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import JSZip from "jszip";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { downloadBlob, toQboCsv, toYtdCsv } from "@/lib/csv";
import { mergeResults, totals } from "@/lib/merge";
import { extractPdfText } from "@/lib/pdf";
import { parseExtractedText } from "@/lib/parsers";
import {
  PREVIEW_LIMIT,
  PRICE_USD,
  PRODUCT_NAME,
  type FileParseResult,
  type Tx,
} from "@/lib/types";
import {
  buyUrl,
  isStoredUnlocked,
  persistUnlock,
  shouldUnlockFromQuery,
} from "@/lib/unlock";

function confidenceLabel(n: number): string {
  if (n >= 0.8) return "High";
  if (n >= 0.55) return "Medium";
  return "Low";
}

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function HomeClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileParseResult[]>([]);
  const unlocked = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      return () => window.removeEventListener("storage", onChange);
    },
    () => isStoredUnlocked() || shouldUnlockFromQuery(window.location.search),
    () => false,
  );
  const buy = buyUrl();

  useEffect(() => {
    if (!shouldUnlockFromQuery(window.location.search)) return;
    persistUnlock();
    const url = new URL(window.location.href);
    url.searchParams.delete("unlock");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  const merged = useMemo(() => mergeResults(files), [files]);
  const preview = merged.rows.slice(0, PREVIEW_LIMIT);
  const sums = totals(merged.rows);

  const ingest = useCallback(async (list: FileList | File[]) => {
    const pdfs = Array.from(list).filter((f) => {
      const name = f.name.toLowerCase();
      return f.type === "application/pdf" || name.endsWith(".pdf");
    });
    if (pdfs.length === 0) {
      setError("Drop PDF files only. Statements stay in this browser tab.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const next: FileParseResult[] = [];
      for (const file of pdfs) {
        const extracted = await extractPdfText(file);
        next.push(
          parseExtractedText({
            text: extracted.text,
            filename: extracted.filename,
            pageCount: extracted.pageCount,
          }),
        );
      }
      setFiles((prev) => {
        const names = new Set(next.map((f) => f.filename));
        return [...prev.filter((f) => !names.has(f.filename)), ...next];
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not read that PDF in the browser.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    void ingest(e.dataTransfer.files);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.filename !== name));
  }

  async function downloadPack() {
    if (!unlocked) return;
    const zip = new JSZip();
    zip.file("walletpdf-2026-ytd.csv", toYtdCsv(merged.rows));
    zip.file("walletpdf-2026-qbo.csv", toQboCsv(merged.rows));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "walletpdf-2026-ytd-pack.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadYtd() {
    if (!unlocked) return;
    downloadBlob("walletpdf-2026-ytd.csv", toYtdCsv(merged.rows));
  }

  function downloadQbo() {
    if (!unlocked) return;
    downloadBlob("walletpdf-2026-qbo.csv", toQboCsv(merged.rows));
  }

  return (
    <div>
      <DeadlineBanner />

      <h1 className="display text-[2.05rem] leading-tight tracking-tight sm:text-[2.55rem]">
        Drop monthly wallet PDFs. Download one year-to-date file.
      </h1>
      <p className="mt-4 max-w-2xl text-[1.05rem] leading-7 text-mute">
        Built for 1099 and gig workers, and the bookkeepers who close their
        books on a couch. Cash App, Venmo, PayPal, and Zelle statements are
        parsed in this tab. Files never leave the browser.
      </p>

      <section
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-8 border border-dashed px-5 py-10 text-center transition-colors ${
          dragging ? "border-brass bg-panel-2" : "border-line bg-panel"
        }`}
      >
        <p className="text-paper">Drop one or many monthly statement PDFs</p>
        <p className="mt-2 text-sm text-mute">
          Text-layer PDFs only. Scanned image statements cannot be read without
          sending them to an OCR service, which this product will not do.
        </p>
        <button
          type="button"
          className="mt-5 border border-brass-dim bg-ink px-4 py-2 text-sm text-brass hover:border-brass hover:text-paper"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Reading in the browser…" : "Choose PDFs"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void ingest(e.target.files);
            e.target.value = "";
          }}
        />
      </section>

      {error ? (
        <p className="mt-4 border border-warn/40 bg-panel px-4 py-3 text-sm text-warn">{error}</p>
      ) : null}

      {files.length > 0 ? (
        <section className="mt-8">
          <h2 className="display text-xl">Statements in this session</h2>
          <ul className="mt-4 divide-y divide-line border border-line">
            {files.map((f) => (
              <li key={f.filename} className="flex flex-wrap items-start justify-between gap-3 bg-panel px-4 py-3">
                <div>
                  <p className="text-paper">{f.filename}</p>
                  <p className="mt-1 text-sm text-mute">
                    {f.source === "unknown" ? "source unclear" : f.source} · {f.rows.length}{" "}
                    {f.rows.length === 1 ? "row" : "rows"} · confidence {confidenceLabel(f.confidence)}{" "}
                    ({Math.round(f.confidence * 100)}%) · {f.pageCount}{" "}
                    {f.pageCount === 1 ? "page" : "pages"}
                  </p>
                  {f.issue ? (
                    <p className="mt-2 max-w-xl text-sm text-warn">{f.issue.message}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-sm text-mute hover:text-paper"
                  onClick={() => removeFile(f.filename)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-mute">
            Merged {sums.count} rows
            {merged.duplicatesRemoved ? ` · ${merged.duplicatesRemoved} exact duplicates dropped` : ""}
            {" · "}
            in {money(sums.inn)} · out {money(sums.out)} · net {money(sums.net)}
          </p>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-xl">Live preview · first {PREVIEW_LIMIT} rows</h2>
          <p className="text-sm text-mute">
            Full file stays locked until the {PRODUCT_NAME} is unlocked.
          </p>
        </div>
        <PreviewTable rows={preview} empty={merged.rows.length === 0} />
      </section>

      <section id="buy" className="mt-8 border border-line bg-panel px-5 py-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="display text-2xl">
              {unlocked ? "Unlocked · 2026 YTD pack" : `$${PRICE_USD} one-time · ${PRODUCT_NAME}`}
            </h2>
            <p className="mt-3 text-sm leading-6 text-mute">
              Unlock the merged year-to-date CSV (stable columns) and a
              QuickBooks Online-friendly file with Date, Description, Amount.
              Unlock stays on this device. Polar
              handles payment when checkout is live. No subscriptions.
            </p>
          </div>
          <div className="flex min-w-[14rem] flex-col gap-3">
            {unlocked ? (
              <>
                <button
                  type="button"
                  disabled={merged.rows.length === 0}
                  onClick={() => void downloadPack()}
                  className="bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-40"
                >
                  Download YTD + QBO zip
                </button>
                <button
                  type="button"
                  disabled={merged.rows.length === 0}
                  onClick={downloadYtd}
                  className="border border-line px-4 py-2 text-sm text-paper hover:border-brass disabled:opacity-40"
                >
                  CSV only
                </button>
                <button
                  type="button"
                  disabled={merged.rows.length === 0}
                  onClick={downloadQbo}
                  className="border border-line px-4 py-2 text-sm text-paper hover:border-brass disabled:opacity-40"
                >
                  QuickBooks CSV only
                </button>
              </>
            ) : buy ? (
              <a
                href={buy}
                className="bg-brass px-4 py-2 text-center text-sm font-medium text-ink hover:bg-paper"
              >
                Buy the {PRODUCT_NAME} · ${PRICE_USD}
              </a>
            ) : (
              <p className="border border-line px-4 py-3 text-sm text-mute">
                Payments go live shortly. Checkout will run through Polar. No
                charges are taken on this page.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function PreviewTable({ rows, empty }: { rows: Tx[]; empty: boolean }) {
  return (
    <div className="mt-4 overflow-x-auto border border-line">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-panel-2 text-mute">
          <tr>
            <th className="px-3 py-2 font-medium">date</th>
            <th className="px-3 py-2 font-medium">amount</th>
            <th className="px-3 py-2 font-medium">direction</th>
            <th className="px-3 py-2 font-medium">counterparty</th>
            <th className="px-3 py-2 font-medium">note</th>
            <th className="px-3 py-2 font-medium">source</th>
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-mute">
                Rows appear here after a statement is read. The first five stay
                visible on the free preview.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={`${row.raw_line}-${i}`} className="border-t border-line bg-panel">
                <td className="whitespace-nowrap px-3 py-2">{row.date}</td>
                <td className="whitespace-nowrap px-3 py-2">{row.amount.toFixed(2)}</td>
                <td className="px-3 py-2">{row.direction}</td>
                <td className="px-3 py-2">{row.counterparty}</td>
                <td className="px-3 py-2 text-mute">{row.note}</td>
                <td className="px-3 py-2">{row.source}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
