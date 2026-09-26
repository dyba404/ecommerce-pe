import { ShoppingBag } from "lucide-react"

import { retrieveCart } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartDropdown from "../cart-dropdown"

export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)

  const totalItems =
    cart?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  return (
    <>
      {/* Móvil: botón circular con icono y badge de contador de items */}
      <LocalizedClientLink
        href="/cart"
        data-testid="nav-cart-link"
        aria-label={`Carrito, ${totalItems} artículos`}
        className="relative w-11 h-11 rounded-full border border-ui-border-base bg-white flex items-center justify-center text-ui-fg-base transition-colors duration-200 hover:text-ui-fg-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive small:hidden"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {totalItems > 0 && (
          <span
            data-testid="nav-cart-count"
            className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-ui-fg-interactive text-white text-[10px] font-medium flex items-center justify-center px-1"
          >
            {totalItems}
          </span>
        )}
      </LocalizedClientLink>

      {/* Desktop: dropdown de carrito sin cambios */}
      <div className="hidden small:block h-full">
        <CartDropdown cart={cart} />
      </div>
    </>
  )
}
