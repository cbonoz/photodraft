import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "@/components/ThemeToggle";

const title = "PhotoDraft — Turn-based photo draft game";
const description =
  "Upload photos, add players, and draft them turn by turn. A fun way to pick photos with friends — like a fantasy draft for images.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s — PhotoDraft",
  },
  description,
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "PhotoDraft",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ThemeProvider>
          <Providers>{children}</Providers>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
