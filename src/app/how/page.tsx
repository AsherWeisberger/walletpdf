import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to download wallet statements — WalletPDF",
  description:
    "Current paths to download monthly Cash App, Venmo, PayPal, and Zelle (bank) statement PDFs for a year-to-date CSV.",
};

export default function HowPage() {
  return (
    <article className="max-w-3xl">
      <p className="text-sm text-brass">
        <Link href="/" className="hover:text-paper">
          Back to the drop zone
        </Link>
      </p>
      <h1 className="display mt-4 text-3xl tracking-tight">How to get the PDFs</h1>
      <p className="mt-4 leading-7 text-mute">
        WalletPDF reads the monthly statement you already download from each
        app or bank. Menus move around; these paths were checked against public
        help pages in 2026. If a screen looks different, search that app for
        “statements”.
      </p>
      <p className="mt-3 text-sm text-mute">
        Need selectable text. If Preview or Acrobat will not let you highlight
        a transaction line, it is a scan — export a text or CSV file from the
        wallet app instead.
      </p>

      <section className="mt-10">
        <h2 className="display text-2xl">Cash App</h2>
        <p className="mt-3 text-sm text-mute">
          Official help: Profile → Documents → Account Statements. Monthly
          files usually appear within five business days after month end.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7">
          <li>
            Phone: open Cash App → profile icon → Documents → Account
            Statements → pick the month → download the PDF.
          </li>
          <li>
            Web: sign in at cash.app/account → Documents → Account statements
            → expand the year → View next to the month → save the PDF.
          </li>
          <li>
            Repeat for each month you need in 2026, then drop the files here
            together.
          </li>
        </ol>
        <p className="mt-3 text-sm text-mute">
          The PDF lists peer payments, Cash Card purchases, direct deposits,
          ATM withdrawals, and fees around beginning and ending balance.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="display text-2xl">Venmo</h2>
        <p className="mt-3 text-sm text-mute">
          Venmo’s help center documents CSV statements. A PDF still works if it
          has a text layer (print-to-PDF of the statement view, or a PDF
          someone already saved).
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7">
          <li>
            Phone: Settings → Statements → year and month → download to the
            device or email the file.
          </li>
          <li>
            Web: sign in at venmo.com → Statements in the sidebar → month and
            year → Download CSV. If you only have a PDF, drop that. If you
            printed the CSV to PDF, drop that too — selectable text is what
            matters.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="display text-2xl">PayPal</h2>
        <p className="mt-3 text-sm text-mute">
          Monthly statements are typically available after the 2nd of the
          following month. Some accounts auto-generate a PDF by the 10th.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7">
          <li>
            Web: paypal.com → Activity → Statements (sometimes labeled
            Statements and reports).
          </li>
          <li>
            Monthly file: paypal.com/reports/accountStatements → Request next
            to the month → Download when ready.
          </li>
          <li>
            Custom range: Activity → download icon → Custom → date range → PDF.
            Reports can cover up to 12 months and up to seven years of history.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="display text-2xl">Zelle</h2>
        <p className="mt-3 leading-7 text-mute">
          Zelle does not issue its own monthly statement. Sends and receives
          post on your bank or credit-union checking statement, usually labeled
          ZELLE FROM / ZELLE TO or “Zelle payment”.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7">
          <li>
            Sign in to the bank’s desktop site (export options are usually
            better than the mobile app).
          </li>
          <li>
            Open Statements &amp; Documents (wording varies) → choose the
            checking account that uses Zelle → download the monthly PDF.
          </li>
          <li>
            Drop those bank PDFs here. WalletPDF keeps Zelle-labeled rows and
            skips unrelated POS or payroll lines.
          </li>
        </ol>
      </section>

      <p className="mt-12 text-sm text-mute">
        After the files are on this device, go back to the{" "}
        <Link href="/" className="text-brass hover:text-paper">
          drop zone
        </Link>
        . Parsing never leaves the browser.
      </p>
    </article>
  );
}
