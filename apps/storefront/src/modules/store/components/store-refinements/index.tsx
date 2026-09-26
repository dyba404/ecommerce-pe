"use client"

import { useState } from "react"
import { useCurrentRefinements, useSortBy } from "react-instantsearch"

import ChevronDown from "@modules/common/icons/chevron-down"
import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { clx } from "@modules/common/components/ui"
import {
  CATEGORY_ATTRIBUTE,
  LABELS_ATTRIBUTE,
  getSortOptions,
} from "./attributes"
import CurrentRefinements from "./current-refinements"
import OnSaleToggle from "./on-sale-toggle"
import OptionRefinements from "./option-refinements"
import PriceRange from "./price-range"
import RefinementGroup from "./refinement-group"

const SortProducts = ({ currencyCode }: { currencyCode: string }) => {
  const items = getSortOptions(currencyCode)
  const { currentRefinement, refine } = useSortBy({ items })

  return (
    <FilterRadioGroup
      title="Ordenar por"
      items={items}
      value={currentRefinement}
      handleChange={refine}
      data-testid="sort-by-container"
    />
  )
}

const StoreRefinements = ({ currencyCode }: { currencyCode: string }) => {
  // Móvil: los productos van primero; el muro de filtros vive detrás de un
  // disclosure cerrado (abrirlo es decisión del usuario). Desktop conserva la
  // barra lateral siempre visible.
  const [open, setOpen] = useState(false)
  const { items: activeRefinements } = useCurrentRefinements()

  return (
    <div className="w-full small:w-[250px] small:shrink-0 small:ml-[1.675rem]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="store-filters-panel"
        data-testid="filters-toggle"
        className="small:hidden flex items-center justify-between w-full px-6 py-3 border-y border-ui-border-base text-ui-fg-base txt-compact-medium-plus bg-ui-bg-base"
      >
        <span>Filtros{activeRefinements.length > 0 ? ` (${activeRefinements.length})` : ""}</span>
        <span className={clx("transition-transform duration-200", open && "rotate-180")}>
          <ChevronDown />
        </span>
      </button>
      <div
        id="store-filters-panel"
        className={clx(
          "flex-col gap-12 py-4 mb-8 small:px-0 pl-6",
          open ? "flex" : "hidden small:flex"
        )}
      >
        {/* h2 sr-only: los grupos de filtros usan h3 (Radix Accordion.Header); sin
            este intermedio el orden de encabezados salta h1→h3 (WCAG 1.3.1). */}
        <h2 className="sr-only">Filtros</h2>
        <SortProducts currencyCode={currencyCode} />
        <CurrentRefinements currencyCode={currencyCode} />
        <OptionRefinements />
        <PriceRange currencyCode={currencyCode} />
        <OnSaleToggle currencyCode={currencyCode} />
        <RefinementGroup attribute={CATEGORY_ATTRIBUTE} title="Categoría" />
        <RefinementGroup attribute={LABELS_ATTRIBUTE} title="Etiquetas" />
      </div>
    </div>
  )
}

export default StoreRefinements
