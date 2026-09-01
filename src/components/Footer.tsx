import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line pt-8 text-sm leading-6 text-mute">
      <p>
        WalletPDF is a record-keeping tool. It is not tax advice, not a CPA
        service, and not affiliated with Cash App, Block, Venmo, PayPal, Zelle,
        Early Warning Services, or Intuit QuickBooks. Names of those products
        are used only to describe the statements you already have.
      </p>
      <p className="mt-3">
        Statement PDFs are parsed in your browser with pdf.js. Files are not
        uploaded, not stored, and not sent to WalletPDF servers. Checkout, when
        live, is handled by Polar. See{" "}
        <Link href="/privacy" className="text-brass hover:text-paper">
          privacy
        </Link>
        .
      </p>
      <p className="mt-3">
        A product of Asher Weisberger, Terre Haute, IN. Planned domain
        walletpdf.com.
      </p>
    </footer>
  );
}
