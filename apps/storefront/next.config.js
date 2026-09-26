const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Override de distDir solo para auditorías locales: `SF_DIST_DIR=.next-prod`
  // permite correr `next build`+`next start` sin pisar el `.next` del dev server.
  distDir: process.env.SF_DIST_DIR || ".next",
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Las imágenes demo del seed viven en el S3 de Medusa (eu-west-1): el
  // fetch cold tarda ~12s desde PE, por encima del timeout default del
  // optimizador (7s). Se sube el timeout y se cachea 4h. Post-MVP: hospedar
  // los assets en el backend/S3 propio.
  experimental: {
    imgOptTimeoutInSeconds: 30,
  },
  images: {
    // Optimizador de next/image ACTIVO (requiere sharp, ya en deps): el flag
    // unoptimized del starter dejaba pasar los PNG demo de ~900KB tal cual
    // (LCP 6.3s en móvil). Volver a unoptimized solo si no hay sharp en host.
    minimumCacheTTL: 14400,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
