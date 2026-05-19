import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelKu Admin - Manajemen Pemesanan",
  description: "Management Portal for TravelKu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist.css" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen">
        {children}
      </body>
    </html>
  );
}