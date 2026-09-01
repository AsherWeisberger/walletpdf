import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const ibm = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "WalletPDF — year-to-date CSV from wallet statements",
  description:
    "Drop monthly Cash App, Venmo, PayPal, or Zelle statement PDFs and download one merged YTD CSV plus a QuickBooks Online-friendly file. Files never leave the browser.",
  metadataBase: new URL("https://walletpdf.com"),
  openGraph: {
    title: "WalletPDF",
    description:
      "Client-side YTD CSV from Cash App, Venmo, PayPal, and Zelle monthly PDFs. $19 for the 2026 pack.",
    url: "https://walletpdf.com",
    siteName: "WalletPDF",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibm.variable} ${fraunces.variable}`}>
      <body className="antialiased">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-10 pt-6 sm:px-8">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
