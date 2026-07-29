import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "PhotoDraft",
  description: "Draft photos turn by turn",
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
