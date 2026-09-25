"use client"

import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Text } from "@modules/common/components/ui"
import { useCallback, useEffect, useRef, useState, type JSX } from "react"
import PaymentContainer from "../payment-container"

// Checkout Custom de Culqi: tokenización siempre client-side en el modal
// hospedado (PCI SAQ-D propio → nunca tocamos PAN/OTP). El backend solo
// recibe source_id (tkn_/ype_) persistido en la data de la payment session;
// el provider crea el charge en authorize (ver backend culqi-payment).
const CULQI_SCRIPT_URL = "https://js.culqi.com/checkout-js"

let culqiScriptPromise: Promise<void> | null = null

function loadCulqiScript(): Promise<void> {
  if (culqiScriptPromise) {
    return culqiScriptPromise
  }
  culqiScriptPromise = new Promise<void>((resolve, reject) => {
    if (window.CulqiCheckout) {
      return resolve()
    }
    const script = document.createElement("script")
    script.src = CULQI_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(
        new Error(
          "No se pudo cargar el script de Culqi (js.culqi.com). Revisa tu conexión e inténtalo de nuevo."
        )
      )
    document.body.appendChild(script)
  }).catch((err: unknown) => {
    // Si falla la carga, el próximo intento reintenta desde cero.
    culqiScriptPromise = null
    throw err
  })
  return culqiScriptPromise
}

type CulqiPaymentContainerProps = {
  cart: HttpTypes.StoreCart
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  setError: (error: string | null) => void
  setPaymentComplete: (complete: boolean) => void
}

const CulqiPaymentContainer: React.FC<CulqiPaymentContainerProps> = ({
  cart,
  paymentProviderId,
  selectedPaymentOptionId,
  disabled = false,
  paymentInfoMap,
  setError,
  setPaymentComplete,
}) => {
  const publicKey = process.env.NEXT_PUBLIC_CULQI_KEY
  const [scriptReady, setScriptReady] = useState(false)
  const [token, setToken] = useState<CulqiTokenData | null>(null)
  const [savingToken, setSavingToken] = useState(false)

  const culqiInstanceRef = useRef<CulqiCheckoutInstance | null>(null)

  const isSelected = selectedPaymentOptionId === paymentProviderId

  // El token se persiste en la payment session (data.source_id) — el provider
  // lee source_id/email en authorizePayment al completar el cart.
  const persistToken = useCallback(
    async (culqiToken: CulqiTokenData) => {
      setSavingToken(true)
      setError(null)
      try {
        await initiatePaymentSession(cart, {
          provider_id: paymentProviderId,
          data: {
            source_id: culqiToken.id,
            email: cart.email ?? undefined,
          },
        })
        setToken(culqiToken)
        setPaymentComplete(true)
      } catch (err) {
        setToken(null)
        setPaymentComplete(false)
        setError(
          "No se pudo registrar el pago: " +
            (err instanceof Error ? err.message : String(err))
        )
      } finally {
        setSavingToken(false)
      }
    },
    [cart, paymentProviderId, setError, setPaymentComplete]
  )

  const latestRef = useRef({ cart, persistToken, setError })
  latestRef.current = { cart, persistToken, setError }

  // Callback global del script de Culqi: entrega token (tkn_/ype_), orden u
  // error con user_message ya en español.
  useEffect(() => {
    window.culqi = () => {
      const culqi = culqiInstanceRef.current
      if (!culqi) {
        return
      }
      if (culqi.token?.id) {
        culqi.close()
        latestRef.current.persistToken(culqi.token)
        return
      }
      if (culqi.order?.id) {
        culqi.close()
        latestRef.current.setError(
          "Este método (orden Culqi) todavía no está habilitado en la tienda."
        )
        return
      }
      if (culqi.error) {
        latestRef.current.setError(
          culqi.error.user_message ??
            culqi.error.merchant_message ??
            `Culqi rechazó el pago (${culqi.error.code ?? culqi.error.type ?? "error desconocido"}).`
        )
      }
    }
    return () => {
      delete window.culqi
    }
  }, [])

  // Cambiar de método invalida el token mostrado: la re-selección re-inicia la
  // session sin source_id y el token se vuelve a generar.
  useEffect(() => {
    if (!isSelected && token) {
      setToken(null)
      setPaymentComplete(false)
    }
  }, [isSelected, token, setPaymentComplete])

  const openCulqi = async () => {
    if (!publicKey) {
      return
    }
    setError(null)
    if (!window.CulqiCheckout) {
      try {
        await loadCulqiScript()
        setScriptReady(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return
      }
    }
    const constructor = window.CulqiCheckout
    if (!constructor) {
      setError("Culqi no está disponible en este momento; recarga la página.")
      return
    }
    if (!cart.email) {
      setError("Completa tu email en el paso de dirección antes de pagar.")
      return
    }
    const amount = cart.total == null ? 0 : Math.round(Number(cart.total) * 100)
    if (amount <= 0) {
      setError("El total del pedido aún no está calculado; inténtalo de nuevo.")
      return
    }
    const culqi = new constructor(publicKey, {
      settings: {
        title: "Pago seguro",
        currency: "PEN",
        amount,
        description: "Compra en tienda",
      },
      client: { email: cart.email },
      options: {
        lang: "es",
        modal: true,
        installments: false,
        paymentMethods: {
          tarjeta: true,
          yape: true,
          // Órdenes Culqi (PagoEfectivo/billeteras/Cuotéalo) requieren soporte
          // de orders en el provider — fuera de este change.
          billetera: false,
          bancaMovil: false,
          agente: false,
          cuotealo: false,
          pagoEfectivo: false,
        },
      },
    })
    culqiInstanceRef.current = culqi
    culqi.open()
  }

  // Carga perezosa del script solo cuando el método está seleccionado.
  useEffect(() => {
    if (!isSelected || !publicKey || scriptReady) {
      return
    }
    loadCulqiScript()
      .then(() => setScriptReady(true))
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err))
      )
  }, [isSelected, publicKey, scriptReady, setError])

  const tokenLabel = token
    ? [token.card_brand, token.card_number?.slice(-4) ?? token.last4]
        .filter(Boolean)
        .join(" · ") ||
      (token.type === "yape" || token.id.startsWith("ype_")
        ? "Yape"
        : "Tarjeta")
    : null

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled || !publicKey}
    >
      {isSelected && !publicKey && (
        <Text className="txt-medium text-ui-fg-error my-2">
          Culqi no está configurado en este entorno: falta
          NEXT_PUBLIC_CULQI_KEY (la clave pública pk_) en
          apps/storefront/.env. Las claves salen del dashboard de Culqi.
        </Text>
      )}
      {isSelected && publicKey && (
        <div className="my-4 flex flex-col gap-y-3">
          {token ? (
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center gap-x-2 text-ui-fg-base">
                <CheckCircleSolid />
                <Text className="txt-medium-plus">
                  Pago listo{tokenLabel ? `: ${tokenLabel}` : ""}
                </Text>
              </div>
              <Button
                variant="transparent"
                size="small"
                className="self-start"
                onClick={openCulqi}
                data-testid="culqi-reopen-button"
              >
                Cambiar tarjeta o método
              </Button>
            </div>
          ) : (
            <>
              <Text className="txt-medium text-ui-fg-subtle">
                Tarjeta (Visa/Mastercard) o Yape, en el checkout seguro de
                Culqi. Yape: máximo S/ 2,000 por operación.
              </Text>
              <Button
                variant="secondary"
                className="self-start"
                onClick={openCulqi}
                disabled={!publicKey}
                data-testid="culqi-open-button"
              >
                Ingresar datos de pago
              </Button>
            </>
          )}
          {savingToken && (
            <Text className="txt-medium text-ui-fg-subtle">
              Confirmando método de pago…
            </Text>
          )}
        </div>
      )}
    </PaymentContainer>
  )
}

export default CulqiPaymentContainer
