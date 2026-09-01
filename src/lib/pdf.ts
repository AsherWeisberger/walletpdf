"use client";

export type ExtractedPdf = {
  filename: string;
  pageCount: number;
  text: string;
};

type TextItem = {
  str?: string;
  transform?: number[];
};

function groupItemsIntoLines(items: TextItem[]): string[] {
  const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
  const yTol = 3;

  for (const item of items) {
    const str = (item.str ?? "").replace(/\u00a0/g, " ");
    if (!str) continue;
    const tr = item.transform ?? [1, 0, 0, 1, 0, 0];
    const x = tr[4] ?? 0;
    const y = Math.round(tr[5] ?? 0);
    let line = lines.find((l) => Math.abs(l.y - y) <= yTol);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x, str });
  }

  lines.sort((a, b) => b.y - a.y);
  return lines.map((line) => {
    line.parts.sort((a, b) => a.x - b.x);
    let out = "";
    let lastEnd = -Infinity;
    for (const part of line.parts) {
      const gap = part.x - lastEnd;
      if (out && gap > 1.5) out += " ";
      out += part.str;
      lastEnd = part.x + part.str.length * 4;
    }
    return out.replace(/\s+/g, " ").trim();
  });
}

export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  const pdfjs = await import("pdfjs-dist");
  const { getDocument, GlobalWorkerOptions } = pdfjs;

  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({
    data,
    // Disable extra network fetches; statements are local files.
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: true,
  } as Parameters<typeof getDocument>[0]);
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];
    const lines = groupItemsIntoLines(items);
    pages.push(lines.filter(Boolean).join("\n"));
  }

  try {
    await pdf.destroy();
  } catch {
    // ignore
  }

  return {
    filename: file.name,
    pageCount: pdf.numPages,
    text: pages.join("\n"),
  };
}
