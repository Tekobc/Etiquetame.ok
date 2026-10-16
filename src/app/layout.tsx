import type { Metadata } from "next";
import { Bagel_Fat_One, Figtree } from "next/font/google";
import "./globals.css";

const displayFont = Bagel_Fat_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const bodyFont = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Etiquétame | Stickers y detalles personalizados",
  description:
    "Stickers, almanaques, toppers, encendedores y señaladores personalizados, hechos con cariño por Luana.",
  applicationName: "Etiquétame",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
