"use client"

import { User, Home, Store, ShoppingCart } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "Inicio", Icon: Home, exact: true },
  { href: "/store", label: "Tienda", Icon: Store, exact: false },
  { href: "/cart", label: "Carrito", Icon: ShoppingCart, exact: false },
  { href: "/account", label: "Cuenta", Icon: User, exact: false },
]

/**
 * Bottom tab bar móvil (estilo app): visible solo <640px, oculta en las
 * páginas de producto (allí manda la barra fija de acciones del PDP).
 * Activa por pathname con acento esmeralda; safe-area para el home indicator.
 */
const MobileTabBar = () => {
  const pathname = usePathname() ?? ""

  // El countryCode va como primer segmento (/pe/...): la raíz del sitio es
  // "/<país>", así que Inicio solo activa ahí y el resto por prefijo.
  const root = "/" + (pathname.split("/")[1] ?? "")

  // PDP: la barra fija de acciones del producto ocupa el fondo.
  if (pathname.includes("/products/")) {
    return null
  }

  return (
    <nav
      className="flex small:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ui-border-base"
      data-testid="mobile-tab-bar"
    >
      <div className="grid grid-cols-4 w-full pb-[env(safe-area-inset-bottom,0px)]">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = exact
            ? pathname === root || pathname === root + "/"
            : pathname.startsWith(href)

          return (
            <LocalizedClientLink
              key={href}
              href={href}
              className={clx(
                "flex flex-col items-center justify-center gap-y-0.5 py-2 min-h-[3.25rem]",
                active ? "text-ui-fg-interactive" : "text-ui-fg-subtle"
              )}
              data-testid={`mobile-tab-${label.toLowerCase()}`}
            >
              <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
              <span className="text-[10px] leading-tight">{label}</span>
            </LocalizedClientLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileTabBar
