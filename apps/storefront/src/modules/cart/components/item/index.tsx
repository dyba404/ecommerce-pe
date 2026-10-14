"use client"

import { Minus, Plus } from "lucide-react"
import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  layout?: "table" | "card"
}

const Item = ({
  item,
  type = "full",
  currencyCode,
  layout = "table",
}: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  // Tarjeta apilada para móvil (<small:); sin tabla, el starter desborda a 360px.
  if (layout === "card") {
    return (
      <div
        className="flex gap-x-3 items-start border border-ui-border-base rounded-rounded p-3 bg-white"
        data-testid="product-row-card"
      >
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="block w-20 h-20 shrink-0"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
            title={item.product_title}
            className="!p-0"
          />
        </LocalizedClientLink>

        <div className="flex-1 min-w-0">
          <Text
            className="text-small-regular text-ui-fg-base line-clamp-2"
            data-testid="product-title"
          >
            {item.product_title}
          </Text>
          <div className="[&_p]:text-xs">
            <LineItemOptions
              variant={item.variant}
              data-testid="product-variant"
            />
          </div>

          <div className="mt-2 inline-flex items-center border border-ui-border-base rounded-full h-8">
            <button
              type="button"
              aria-label="Disminuir cantidad"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-ui-fg-base disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-8 flex items-center justify-center gap-x-1 text-small-regular text-ui-fg-base">
              {item.quantity}
              {updating && <Spinner size="12" />}
            </span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={updating || item.quantity >= maxQuantity}
              className="w-8 h-8 flex items-center justify-center text-ui-fg-base disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-y-1 shrink-0">
          <DeleteButton id={item.id} data-testid="product-delete-button" />
          <div className="whitespace-nowrap [&_[data-testid=product-price]]:text-small-regular [&_[data-testid=product-price]]:font-medium [&_[data-testid=product-price]]:text-ui-fg-base">
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </div>
      </div>
    )
  }

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
            title={item.product_title}
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-1.5 items-center w-auto small:w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-12 h-10 p-2 small:w-14 small:p-4"
              data-testid="product-select-button"
            >
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i + 1}>
                    {i + 1}
                  </option>
                )
              )}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
