import Link from "next/link";

export function Header() {
  return (
    <header className="mb-10 flex items-baseline justify-between gap-4">
      <Link href="/" className="display text-xl tracking-tight text-paper">
        WalletPDF
      </Link>
      <nav className="flex items-center gap-6 text-sm text-mute">
        <Link href="/how" className="hover:text-paper">
          How to get statements
        </Link>
        <Link href="/privacy" className="hover:text-paper">
          Privacy
        </Link>
        <a href="#buy" className="text-brass hover:text-paper">
          $19 YTD pack
        </a>
      </nav>
    </header>
  );
}
