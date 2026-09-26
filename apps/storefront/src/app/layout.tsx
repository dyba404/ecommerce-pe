import { getBaseURL } from "@lib/util/env"
import { getStoreName } from "@lib/util/site"
import { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import "styles/globals.css"

// Sans principal (legibilidad móvil, glifos es-PE) + serif de exhibición para
// titulares (registro editorial de tienda de ropa). Ambas vía next/font con
// subset latin: sin FOUT de red y sin dependencia de Google Fonts en runtime.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    template: `%s | ${getStoreName()}`,
    default: getStoreName(),
  },
  description:
    "Ropa esencial en soles, con envío a todo el Perú. Paga con tarjeta o Yape.",
}

// Mobile-native: viewport-fit=cover + safe-area env() en nav/barras fijas
// (contenido edge-to-edge en teléfonos con muesca); theme-color = bg del
// header (blanco) para que el chrome del navegador no pelee con la página.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="es" data-mode="light">
      <body className={`${manrope.variable} ${cormorant.variable} font-sans`}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
