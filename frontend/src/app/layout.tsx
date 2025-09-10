import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Treasure Hunt",
    default: "Treasure Hunt",
  },
  description: "An interactive QR code treasure hunt game",
  keywords: ["treasure hunt", "QR code", "game", "interactive"],
  authors: [{ name: "Treasure Hunt Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8B4513",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
