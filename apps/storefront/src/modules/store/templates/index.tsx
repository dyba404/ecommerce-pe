"use client"

import type { SearchClient } from "instantsearch.js"
import { Configure } from "react-instantsearch"
import { InstantSearchNext } from "react-instantsearch-nextjs"

import { PRODUCT_INDEX_NAME, searchClient } from "@lib/search-client"
import StoreHits from "@modules/store/components/store-hits"
import StoreRefinements from "@modules/store/components/store-refinements"
import StoreSearchBox from "@modules/store/components/store-search-box"

const PRODUCT_LIMIT = 12

const StoreTemplate = ({
  currencyCode,
  productCount,
}: {
  currencyCode: string
  productCount: number
}) => {
  return (
    <div className="py-6 content-container" data-testid="category-container">
      <div className="mb-8 text-2xl-semi">
        <h1 data-testid="store-page-title">Todos los productos</h1>
      </div>

      <div className="flex flex-col small:flex-row small:items-start">
        {/* SSR + hidratación del estado de búsqueda via react-instantsearch-nextjs:
            sin esto el árbol entero de la búsqueda monta en el cliente (causa
            raíz del CLS 1.202 de esta página). Mismo contrato que InstantSearch. */}
        <InstantSearchNext
          indexName={PRODUCT_INDEX_NAME}
          searchClient={searchClient as unknown as SearchClient}
          routing
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <Configure hitsPerPage={PRODUCT_LIMIT} />
          <StoreRefinements currencyCode={currencyCode} />
          <div className="w-full min-w-0">
            <StoreSearchBox />
            <StoreHits
              hitsPerPage={PRODUCT_LIMIT}
              currencyCode={currencyCode}
              productCount={productCount}
            />
          </div>
        </InstantSearchNext>
      </div>
    </div>
  )
}

export default StoreTemplate
