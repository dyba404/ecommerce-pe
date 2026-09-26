import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  // Las rutas transaccionales viven bajo /[countryCode]/: se bloquea su
  // indexación con comodín. /api/ incluye webhooks de pago.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*/account", "/*/cart", "/*/checkout"],
    },
  }
}
