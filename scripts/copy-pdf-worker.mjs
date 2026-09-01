import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, "public");
mkdirSync(destDir, { recursive: true });

let src = null;
try {
  const pkgDir = dirname(require.resolve("pdfjs-dist/package.json"));
  const candidates = [
    join(pkgDir, "build", "pdf.worker.min.mjs"),
    join(pkgDir, "legacy", "build", "pdf.worker.min.mjs"),
    join(pkgDir, "build", "pdf.worker.mjs"),
  ];
  src = candidates.find((p) => existsSync(p)) ?? null;
} catch {
  src = null;
}

if (!src) {
  console.warn("walletpdf: pdfjs-dist worker not found yet; skipping copy");
  process.exit(0);
}

copyFileSync(src, join(destDir, "pdf.worker.min.mjs"));
console.log("walletpdf: copied pdf.worker.min.mjs to public/");
