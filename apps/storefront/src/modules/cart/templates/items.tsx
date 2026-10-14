import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@modules/common/components/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

// Skeleton de tarjeta para el estado de carga en móvil (imita Item con
// layout="card"); SkeletonLineItem es una fila de <table> y no puede
// renderizarse dentro de un div.
const SkeletonItemCard = () => {
  return (
    <div className="flex gap-x-3 items-start border border-ui-border-base rounded-rounded p-3 bg-white">
      <div className="w-20 h-20 shrink-0 bg-gray-200 animate-pulse" />
      <div className="flex-1 min-w-0 flex flex-col gap-y-2">
        <div className="w-3/4 h-4 bg-gray-200 animate-pulse" />
        <div className="w-1/2 h-3 bg-gray-200 animate-pulse" />
        <div className="w-32 h-8 bg-gray-200 animate-pulse rounded-full" />
      </div>
      <div className="w-16 h-4 bg-gray-200 animate-pulse" />
    </div>
  )
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
    ? [...cart.items].sort((a, b) => {
        return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      })
    : undefined

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-2xl small:text-[2rem] leading-8 small:leading-[2.75rem]">
          Carrito
        </Heading>
      </div>
      {/* Móvil (<small:): tarjetas apiladas de item — la tabla del starter
          desborda a 360px (min-width de sus columnas). */}
      <div className="flex flex-col gap-y-4 small:hidden">
        {items
          ? items.map((item) => {
              return (
                <Item
                  key={item.id}
                  item={item}
                  layout="card"
                  currencyCode={cart?.currency_code}
                />
              )
            })
          : repeat(5).map((i) => {
              return <SkeletonItemCard key={i} />
            })}
      </div>
      {/* Desktop (small:): la tabla original sin cambios, solo oculta en móvil. */}
      <div className="hidden small:block overflow-x-auto [&_table]:!table-fixed [&_table]:!w-full [&_td]:!px-2 [&_th]:!px-2 small:[&_td]:!px-4 small:[&_th]:!px-4">
        <Table>
          <Table.Header className="border-t-0">
            <Table.Row className="text-ui-fg-subtle txt-medium-plus">
              <Table.HeaderCell className="!pl-0 w-14 small:w-auto">
                Producto
              </Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell className="w-[84px] small:w-auto">
                Cant.
              </Table.HeaderCell>
              <Table.HeaderCell className="hidden small:table-cell">
                Precio
              </Table.HeaderCell>
              <Table.HeaderCell className="!pr-0 text-right w-[76px] small:w-auto">
                Total
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items
              ? items.map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
                    />
                  )
                })
              : repeat(5).map((i) => {
                  return <SkeletonLineItem key={i} />
                })}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export default ItemsTemplate
