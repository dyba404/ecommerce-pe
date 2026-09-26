import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  // Badge de descuento: la venta la marca price_type === "sale" sobre el
  // precio más barato. El porcentaje solo si hay números disponibles; si no,
  // badge "Oferta" sin porcentaje (las strings formateadas no sirven para
  // calcular).
  const isOnSale = cheapestPrice?.price_type === "sale"
  const originalPriceNumber = cheapestPrice?.original_price_number
  const calculatedPriceNumber = cheapestPrice?.calculated_price_number
  const discountPercentage =
    isOnSale &&
    typeof originalPriceNumber === "number" &&
    typeof calculatedPriceNumber === "number" &&
    originalPriceNumber > 0 &&
    calculatedPriceNumber < originalPriceNumber
      ? Math.round(
          ((originalPriceNumber - calculatedPriceNumber) /
            originalPriceNumber) *
            100
        )
      : null

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            title={product.title}
          />
          {isOnSale && (
            <span
              data-testid="product-sale-badge"
              className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white bg-ui-fg-interactive"
            >
              {discountPercentage !== null
                ? `-${discountPercentage}%`
                : "Oferta"}
            </span>
          )}
        </div>
        {/* Título arriba, precio debajo (patrón de la referencia): nada de
            pelear horizontalmente; line-clamp-2 uniforma la altura de tarjeta. */}
        <div className="flex flex-col gap-y-1 mt-4">
          <Text
            className="text-ui-fg-base line-clamp-2 leading-snug"
            data-testid="product-title"
          >
            {product.title}
          </Text>
          <div className="flex items-baseline gap-x-2">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
