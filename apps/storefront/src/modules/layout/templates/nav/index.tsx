import { Suspense } from "react"

import { ShoppingBag } from "lucide-react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { getStoreName } from "@lib/util/site"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group bg-white pt-[env(safe-area-inset-top,0px)]">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="font-display text-xl small:text-2xl tracking-tight text-ui-fg-base hover:text-ui-fg-interactive"
              data-testid="nav-store-link"
            >
              {getStoreName()}
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <Search />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base py-3"
                href="/account"
                data-testid="nav-account-link"
              >
                Cuenta
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="relative w-11 h-11 rounded-full border border-ui-border-base bg-white flex items-center justify-center text-ui-fg-base transition-colors duration-200 hover:text-ui-fg-interactive small:w-auto small:h-auto small:border-0 small:bg-transparent small:py-3 small:hover:text-ui-fg-base"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <ShoppingBag
                    className="h-5 w-5 small:hidden"
                    aria-hidden="true"
                  />
                  <span className="hidden small:inline">Carrito (0)</span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
