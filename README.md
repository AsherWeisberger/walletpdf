# WalletPDF
Client-side YTD CSV from wallet statement PDFs.

Drop monthly Cash App, Venmo, PayPal, and Zelle (bank) statement PDFs. Preview five rows for free. The 19 USD one-time 2026 YTD pack unlocks the merged CSV plus a QuickBooks Online-friendly file (Date, Description, Amount).

Statement PDFs never leave the browser. There is no upload API.

Planned domain: walletpdf.com (not live). This is a standard Next.js build and runs on any host, including a vercel.app URL.

Not tax advice. Q3 2026 federal estimated tax is due Tuesday, September 15, 2026.

## Run locally

From /workspace/walletpdf: install packages, run the fixture tests, then start the Next.js dev server. Open localhost:3000. QA unlock (no payment): add query unlock=dev. That writes localStorage key walletpdf_unlocked. For a production build, run the Next.js build then start.

## Polar checkout

Copy .env.example to .env.local and set NEXT_PUBLIC_BUY_URL to your Polar checkout link.

- If the variable is empty, Buy says "payments go live shortly" and does not fake a charge.
- Polar success URL should return to this site with query unlock=1 so this browser stores the unlock flag.
- Restart the dev server after changing env.

## Deploy

Any Node host that can run a Next.js production build, or Vercel. Set NEXT_PUBLIC_BUY_URL in the project environment. No server-side secrets are required for parsing.

## Output

Merged YTD CSV columns (stable):

date, amount, direction, counterparty, note, source, statement_month, raw_line

- date is YYYY-MM-DD
- amount is unsigned with two decimals
- direction is in or out
- source is cashapp | venmo | paypal | zelle

QuickBooks file: Date (MM/DD/YYYY), Description, Amount (signed; money out is negative). Import in QBO via Bank transactions, then Upload from file.

Multiple PDFs are merged, sorted by date, and exact-duplicate rows are dropped.

## Parser coverage

Regex over extracted text (pdf.js getTextContent, grouped into lines). Invented fixtures in src/fixtures/ match public 2025-2026 layouts:

- Cash App: Date / Description / Details / Fee / Amount (Jan 5 ... Cash App payment 0.00 +50.00). Plus means in; Cash Card / ATM unsigned means out.
- Venmo: Statement table Date, Description, Amount, Balance and CSV-like Datetime, Type, From, To, Amount (total). Payments from/to, card, bank transfer.
- PayPal: Transaction history Date, Description, Name/Email, Gross, Fee, Net. Uses Net; type drives direction.
- Zelle: Bank statement lines containing ZELLE / Zelle from / Zelle to. Other checking activity is ignored.

Scanned / image-only PDFs return a visible error asking you to export a text/CSV from the wallet app. No cloud OCR.

The fixture suite covers row counts, 5-row preview, full export with unlock=dev, de-dupe, and the scanned error.

## Stack

Next.js App Router, TypeScript, Tailwind v4, pdfjs-dist (browser), JSZip for the paid pack.

## Nominative use

Cash App, Venmo, PayPal, Zelle, and QuickBooks names describe the files you already have. WalletPDF is not affiliated with those companies and does not use their logos or brand colors.
