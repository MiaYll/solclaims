import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOL.CLAIMS | Claim your SOL",
  description: "Solana Blockchain keeps your SOL, you can get it back!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
