import type { Metadata } from "next";
import { Bagel_Fat_One, Figtree } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://etiquetame.vercel.app";

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
  metadataBase: new URL(siteUrl),
  title: "Etiquétame | Stickers y detalles personalizados",
  description:
    "Stickers, almanaques, toppers, encendedores y señaladores personalizados, hechos con cariño por Luana.",
  applicationName: "Etiquétame",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Etiquétame",
    title: "Etiquétame | Stickers y detalles personalizados",
    description:
      "Stickers, almanaques, toppers, encendedores y señaladores personalizados, hechos con cariño por Luana.",
    images: [{ url: "/brand/logo.png", width: 1181, height: 1181, alt: "Logo de Etiquétame" }],
  },
  twitter: {
    card: "summary",
    title: "Etiquétame | Stickers y detalles personalizados",
    description:
      "Stickers y productos personalizados, hechos con cariño por Luana.",
    images: ["/brand/logo.png"],
  },
  robots: { index: true, follow: true },
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
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Etiquétame",
              alternateName: "Tienda de stickers by Luana",
              url: siteUrl,
              logo: `${siteUrl}/brand/logo.png`,
              description:
                "Stickers y productos personalizados, hechos con cariño por Luana.",
            }).replace(/</g, "\\u003c"),
          }}
          type="application/ld+json"
        />
        {children}
      </body>
    </html>
  );
}
