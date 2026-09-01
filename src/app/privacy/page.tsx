import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — WalletPDF",
  description: "WalletPDF parses statements in the browser and does not store PDFs.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl leading-7">
      <p className="text-sm text-brass">
        <Link href="/" className="hover:text-paper">
          Back
        </Link>
      </p>
      <h1 className="display mt-4 text-3xl tracking-tight">Privacy</h1>
      <p className="mt-4 text-mute">Last updated August 31, 2026.</p>

      <h2 className="display mt-8 text-xl">Statement files</h2>
      <p className="mt-3">
        WalletPDF is a static Next.js app. Cash App, Venmo, PayPal, and bank
        Zelle PDFs are read with pdf.js inside your browser. They are not
        posted to WalletPDF, not written to a server disk, and not retained
        after you close the tab. There is no account for statement history.
      </p>

      <h2 className="display mt-8 text-xl">Unlock flag</h2>
      <p className="mt-3">
        After you buy the 2026 YTD pack, this browser stores{" "}
        <code>walletpdf_unlocked</code> in localStorage so the download buttons
        stay available on this device. That flag never includes statement data.
        QA uses <code>?unlock=dev</code>. Polar success URLs should return to
        this site with <code>?unlock=1</code>.
      </p>

      <h2 className="display mt-8 text-xl">Payments (Polar)</h2>
      <p className="mt-3">
        When <code>NEXT_PUBLIC_BUY_URL</code> is set, the Buy button is a link
        to Polar checkout. Polar processes the $19 charge. WalletPDF does not
        collect card numbers. If that environment variable is empty, the Buy
        control says payments go live shortly and does not take a charge.
      </p>

      <h2 className="display mt-8 text-xl">Hosting logs</h2>
      <p className="mt-3">
        The host (for example Vercel) may log standard request metadata for the
        HTML/JS that serves this site. Statement PDFs are not part of those
        requests.
      </p>

      <h2 className="display mt-8 text-xl">Contact</h2>
      <p className="mt-3">
        Asher Weisberger, Terre Haute, IN. Planned domain walletpdf.com.
      </p>
    </article>
  );
}
