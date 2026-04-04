import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { FontSizeProvider } from "@/components/layout/FontSizeProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SeaSignal — Professional Network for Seafarers",
    template: "%s | SeaSignal",
  },
  description:
    "Privacy-first platform connecting maritime professionals worldwide. Track certificates, share pay data, verify contracts, and connect with fellow seafarers — all without employer access.",
  metadataBase: new URL("https://seasignal.app"),
  openGraph: {
    title: "SeaSignal — Professional Network for Seafarers",
    description:
      "Privacy-first platform connecting maritime professionals worldwide. Track certificates, share pay data, verify contracts, and connect with fellow seafarers.",
    type: "website",
    siteName: "SeaSignal",
    locale: "en_US",
    url: "https://seasignal.app",
    images: [
      {
        url: "https://seasignal.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "SeaSignal — Professional Network for Seafarers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SeaSignal — Professional Network for Seafarers",
    description:
      "Privacy-first platform connecting maritime professionals worldwide. Track certificates, share pay data, and verify contracts.",
    images: ["https://seasignal.app/og-image.png"],
  },
  alternates: {
    canonical: "https://seasignal.app",
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "seafarer",
    "maritime",
    "professional network",
    "certificate tracker",
    "pay transparency",
    "crew finder",
    "contract check",
    "MLC 2006",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0EA5E9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SeaSignal" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full bg-navy-950 text-slate-100 antialiased">
        <ToastProvider>
          <FontSizeProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </FontSizeProvider>
        </ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
