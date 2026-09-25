import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts || pricedProducts.length === 0) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-16">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-display text-3xl leading-tight text-ui-fg-base">
          {collection.title}
        </h2>
        <LocalizedClientLink
          href={`/collections/${collection.handle}`}
          className="txt-compact-large text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline underline-offset-4"
        >
          Ver todo
        </LocalizedClientLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-10 small:gap-y-14">
        {pricedProducts.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
    </div>
  )
}
