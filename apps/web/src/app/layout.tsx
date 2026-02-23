import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "L2CS ERP",
  description: "Level 2 Computer Solutions — Internal ERP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
