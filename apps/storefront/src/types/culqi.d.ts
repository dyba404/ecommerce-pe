// Tipos mínimos de Checkout Custom de Culqi (js.culqi.com/checkout-js),
// según docs/04-pagos-peru.md: new CulqiCheckout(pk, config) → instancia
// con open()/close()/token/order/error; el resultado llega por window.culqi.
export {}

declare global {
  interface CulqiTokenData {
    id: string
    card_number?: string
    last4?: string
    card_brand?: string
    card_type?: string
    email?: string
    type?: string
    metadata?: Record<string, unknown>
  }

  interface CulqiOrderData {
    id: string
    payment_code?: string
    state?: string
  }

  interface CulqiErrorData {
    type?: string
    code?: string
    user_message?: string
    merchant_message?: string
    param?: string
  }

  interface CulqiCheckoutSettings {
    title?: string
    currency?: string
    amount: number
    order?: string
    description?: string
  }

  interface CulqiPaymentMethods {
    tarjeta?: boolean
    yape?: boolean
    billetera?: boolean
    bancaMovil?: boolean
    agente?: boolean
    cuotealo?: boolean
    pagoEfectivo?: boolean
  }

  interface CulqiCheckoutOptions {
    lang?: string
    modal?: boolean
    installments?: boolean
    paymentMethods?: CulqiPaymentMethods
    paymentMethodsSort?: string[]
    style?: Record<string, unknown>
  }

  interface CulqiCheckoutConfig {
    settings: CulqiCheckoutSettings
    client?: { email?: string }
    options?: CulqiCheckoutOptions
  }

  interface CulqiCheckoutInstance {
    open(): void
    close(): void
    token?: CulqiTokenData | null
    order?: CulqiOrderData | null
    error?: CulqiErrorData | null
  }

  interface Window {
    CulqiCheckout?: new (
      publicKey: string,
      config: CulqiCheckoutConfig
    ) => CulqiCheckoutInstance
    culqi?: () => void
  }
}
