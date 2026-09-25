import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

// Hero home: split editorial (texto a la izquierda, foto real del catálogo a
// la derecha). La imagen es la misma del seed de productos (CDN pública de
// Medusa); nada de blobs de gradiente ni screenshots falsos.
const HERO_IMAGE =
  "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png"

const Hero = () => {
  return (
    <section className="border-b border-ui-border-base">
      <div className="content-container grid grid-cols-1 gap-y-10 py-10 small:grid-cols-2 small:items-center small:gap-x-16 small:py-0">
        <div className="flex flex-col items-start gap-y-6 small:py-16">
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ui-fg-base small:text-6xl">
            Ropa esencial, <em className="leading-[1.1]">bien hecha.</em>
          </h1>
          <p className="text-base-regular text-ui-fg-subtle max-w-md">
            Algodón, denim y abrigos con envío a todo el Perú. Paga en soles
            con tarjeta o Yape.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-12 items-center justify-center rounded-md bg-grey-90 px-6 text-base-semi text-white transition-colors hover:bg-grey-70"
              data-testid="hero-shop-link"
            >
              Ver colección
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/collections/verano-2026"
              className="inline-flex h-12 items-center justify-center rounded-md border border-grey-20 px-6 text-base-semi text-ui-fg-base transition-colors hover:border-grey-90"
              data-testid="hero-collection-link"
            >
              Verano 2026
            </LocalizedClientLink>
          </div>
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-ui-bg-subtle small:aspect-auto small:h-[calc(100dvh-4rem)]">
          <Image
            src={HERO_IMAGE}
            alt="Polera de french terry con capucha, frente"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
