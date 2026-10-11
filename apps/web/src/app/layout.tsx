import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEDIWALLET — Your Health. Your Authority. Your Shield.",
  description:
    "India's patient-owned medical record vault with biometric family access, AI health memory, Hugging Face ML prescription OCR, and verified doctor QR sharing.",
  keywords: [
    "medical wallet",
    "health records",
    "privacy",
    "consent sharing",
    "emergency QR",
    "RxScript OCR",
    "health AI",
    "Hugging Face TrOCR",
    "patient data",
    "digital health vault",
  ],
  authors: [{ name: "MEDIWALLET Health Authority" }],
  openGraph: {
    title: "MEDIWALLET — Patient-Owned Health Vault",
    description:
      "Secure your complete medical history. Share with doctors via time-locked QR. Works offline for emergencies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,600&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-800">
        {children}
      </body>
    </html>
  );
}
