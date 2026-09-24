import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      // Override del payment module para registrar providers (docs/04-pagos-peru.md).
      // A-verificar tras boot que pp_system_default sigue vivo; si no, se
      // re-asignan providers a las regiones vía Admin API.
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // Provider Culqi custom (id final pp_culqi_culqi). Guards en uso:
          // sin CULQI_SECRET_KEY los cargos reales fallan en voz alta.
          {
            resolve: "./src/modules/culqi-payment",
            id: "culqi",
            options: {
              secretKey: process.env.CULQI_SECRET_KEY ?? "",
              publicKey: process.env.CULQI_PUBLIC_KEY ?? "",
              rsaId: process.env.CULQI_RSA_ID,
              rsaPublicKey: process.env.CULQI_RSA_PUBLIC_KEY,
            },
          },
          // Stripe solo con clave presente (sin ella el SDK revienta el boot).
          ...(process.env.STRIPE_API_KEY
            ? [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: process.env.STRIPE_API_KEY,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                    capture: false,
                  },
                },
              ]
            : []),
        ],
      },
    },
  ],
})
