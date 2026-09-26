import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

export default async function StorePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  // Conteo total para que el skeleton del grid tenga la altura del resultado
  // real (la búsqueda es client-side; sin esto el footer salta al hidratar).
  const {
    response: { count },
  } = await listProducts({
    pageParam: 1,
    queryParams: { limit: 1 },
    countryCode,
  })

  return (
    <StoreTemplate currencyCode={region.currency_code} productCount={count} />
  )
}
