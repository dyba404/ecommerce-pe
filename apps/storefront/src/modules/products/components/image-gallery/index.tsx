"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useRef, useState } from "react"

import { clx } from "@modules/common/components/ui"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  productTitle?: string
}

/**
 * Galería-carrusel (patrón Next.js Commerce): una imagen visible con flechas
 * en pastilla flotante + swipe táctil + índice por puntos. Reemplaza el stack
 * vertical, que en móvil convertía el PDP en un scroll interminable.
 */
const ImageGallery = ({ images, productTitle }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const total = images.length
  const alt = (index: number) =>
    productTitle
      ? `${productTitle} — imagen ${index + 1}`
      : `Imagen del producto ${index + 1}`

  const go = (delta: number) => {
    if (total < 2) return
    setActiveIndex((current) => (current + delta + total) % total)
  }

  return (
    <div className="flex items-start relative">
      <div
        className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle rounded-rounded"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || total < 2) return
          const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
          if (Math.abs(delta) > 48) go(delta > 0 ? -1 : 1)
          touchStartX.current = null
        }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className={clx(
              "absolute inset-0 transition-opacity duration-300",
              index === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {!!image.url && (
              <Image
                src={image.url}
                priority={index === 0}
                className="absolute inset-0 rounded-rounded"
                alt={alt(index)}
                fill
                sizes="(max-width: 576px) 100vw, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                style={{ objectFit: "cover" }}
              />
            )}
          </div>
        ))}

        {total > 1 && (
          <>
            {/* Flechas en pastilla flotante, abajo y centrada como la
                referencia: prev | contador | next. */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex h-10 items-center rounded-full border border-white bg-white/80 text-ui-fg-base backdrop-blur-sm">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Imagen anterior"
                className="flex h-full items-center justify-center px-3"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="h-5 w-px bg-ui-border-base" />
              <span className="px-3 text-xs tabular-nums" aria-live="polite">
                {activeIndex + 1} / {total}
              </span>
              <div className="h-5 w-px bg-ui-border-base" />
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Imagen siguiente"
                className="flex h-full items-center justify-center px-3"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="absolute top-3 right-3 rounded-full bg-white/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-ui-fg-base">
              {activeIndex + 1}/{total}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
