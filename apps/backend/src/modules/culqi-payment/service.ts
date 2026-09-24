import {
  AbstractPaymentProvider,
  BigNumber,
  MathBN,
  MedusaError,
} from "@medusajs/framework/utils";
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  BigNumberInput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";

type CulqiOptions = {
  publicKey: string;
  secretKey: string;
  rsaId?: string;
  rsaPublicKey?: string;
  baseUrl?: string;
};

const CULQI_API_BASE = "https://api.culqi.com/v2";

// Espejo de @medusajs/payment-stripe/dist/utils/get-smallest-unit.js.
// PEN = 2 decimales → multiplier 100 (céntimos). Cero-decimal → 1; 3-decimal → 1000.
function getCurrencyMultiplier(currency: string): number {
  const zeroDecimal = [
    "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
    "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
  ];
  const threeDecimal = ["BHD", "IQD", "JOD", "KWD", "OMR", "TND"];
  const code = currency.toUpperCase();
  if (zeroDecimal.includes(code)) return 1;
  if (threeDecimal.includes(code)) return 1000;
  return 100;
}

function getSmallestUnit(amount: BigNumberInput, currency: string): number {
  const multiplier = getCurrencyMultiplier(currency);
  const standard =
    Math.round(new BigNumber(MathBN.mult(amount, multiplier)).numeric) / multiplier;
  const smallest = new BigNumber(MathBN.mult(standard, multiplier));
  let numeric = smallest.numeric;
  if (multiplier === 1e3) {
    numeric = Math.ceil(numeric / 10) * 10;
  }
  return parseInt(numeric.toString().split(".").shift() ?? "0", 10);
}

function getAmountFromSmallestUnit(amount: BigNumberInput, currency: string): number {
  const multiplier = getCurrencyMultiplier(currency);
  return new BigNumber(MathBN.div(amount, multiplier)).numeric;
}

function chargeOutcomeType(charge: Record<string, unknown>): string {
  const outcome = charge.outcome as Record<string, unknown> | undefined;
  return (outcome?.type as string) ?? "";
}

export class CulqiPaymentService extends AbstractPaymentProvider<CulqiOptions> {
  static identifier = "culqi";

  protected options_: CulqiOptions;

  constructor(cradle: Record<string, unknown>, options: CulqiOptions) {
    super(cradle, options);
    this.options_ = options;
  }

  private assertConfigured(): string {
    const { secretKey, baseUrl = CULQI_API_BASE } = this.options_;
    if (!secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Culqi: falta CULQI_SECRET_KEY (sk_). Agrégala en apps/backend/.env y reinicia el backend; los cargos reales no operan sin ella."
      );
    }
    return baseUrl;
  }

  private async culqiRequest(
    path: string,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    body?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const baseUrl = this.assertConfigured();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.options_.secretKey}`,
      "Content-Type": "application/json",
    };
    if (this.options_.rsaId) {
      headers["x-culqi-rsa-id"] = this.options_.rsaId;
    }
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Culqi API ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`
      );
    }
    return (await res.json()) as Record<string, unknown>;
  }

  async initiatePayment({
    currency_code,
    amount,
    data,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    // Culqi no tiene concepto de sesión: se genera un id propio y queda
    // persistido en la data de la payment session (patrón del provider oficial
    // de Stripe: Medusa pasa el session_id en `data`).
    const sessionId = (data?.session_id as string) ?? `culqi_${Date.now()}`;
    return {
      id: sessionId,
      status: "pending",
      data: {
        session_id: sessionId,
        amount: getSmallestUnit(amount, currency_code),
        currency_code,
      },
    };
  }

  async updatePayment({
    currency_code,
    amount,
    data,
  }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // El cart cambió o el storefront pasó source_id/email: se persiste en data.
    // Culqi no cobra aún; el cargo se crea en authorizePayment (los tokens ype_
    // vencen en 2 min, así que la creación ocurre al completar el cart).
    return {
      data: {
        ...(data ?? {}),
        amount: getSmallestUnit(amount, currency_code),
        currency_code,
      },
    };
  }

  async authorizePayment({
    data,
  }: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const sourceId = data?.source_id as string | undefined;
    if (!sourceId) {
      // Sin source_id (PagoEfectivo/billeteras async o tokenización pendiente):
      // queda pending hasta que llegue el webhook o el storefront pase el token.
      return { status: "pending", data };
    }
    const email = data?.email as string | undefined;
    if (!email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Culqi: falta email del cliente para crear el charge."
      );
    }
    const amountSmallest = data?.amount as number;
    if (!amountSmallest) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Culqi: falta amount (céntimos) del pago."
      );
    }
    // Montos en céntimos; Culqi auto-captura al crear el charge.
    const charge = await this.culqiRequest("/charges", "POST", {
      amount: amountSmallest,
      currency_code: data?.currency_code,
      email,
      source_id: sourceId,
      metadata: {
        medusa_session_id: (data?.id as string) ?? (data?.session_id as string),
      },
    });
    const outcome = chargeOutcomeType(charge);
    return {
      status: outcome.startsWith("venta_exitosa") ? "authorized" : "pending",
      data: {
        ...(data ?? {}),
        charge_id: charge.id,
        charge_outcome: outcome || null,
      },
    };
  }

  async capturePayment({ data }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // Culqi captura al crear el charge; capturar en Medusa es idempotente.
    return { data };
  }

  async refundPayment({
    amount,
    data,
  }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const chargeId = data?.charge_id as string | undefined;
    if (!chargeId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Culqi: el pago no tiene charge_id; no hay nada que reembolsar."
      );
    }
    const currencyCode = (data?.currency_code as string) ?? "pen";
    // El monto llega en unidades estándar; Culqi espera céntimos.
    // Culqi no acepta idempotency key documentada en refunds (a-verificar al contratar).
    const refund = await this.culqiRequest("/refunds", "POST", {
      amount: getSmallestUnit(amount, currencyCode),
      charge_id: chargeId,
      reason: "solicitud_comprador",
    });
    return {
      data: { ...(data ?? {}), refund_id: refund.id },
    };
  }

  async cancelPayment({ data }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // Culqi no tiene cancel para charges capturados (solo refund). Cancel es
    // no-op; el reembolso se hace con refundPayment desde Admin.
    return { data };
  }

  async deletePayment(): Promise<DeletePaymentOutput> {
    return {};
  }

  async retrievePayment({ data }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const chargeId = data?.charge_id as string | undefined;
    if (!chargeId) {
      return { data };
    }
    const charge = await this.culqiRequest(`/charges/${chargeId}`, "GET");
    return { data: { ...(data ?? {}), charge } };
  }

  async getPaymentStatus({ data }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const chargeId = data?.charge_id as string | undefined;
    if (!chargeId) {
      return { status: "pending" };
    }
    // Validación por re-consulta: webhooks Culqi no llevan firma (docs/04).
    const charge = await this.culqiRequest(`/charges/${chargeId}`, "GET");
    const outcome = chargeOutcomeType(charge);
    return { status: outcome.startsWith("venta_exitosa") ? "authorized" : "pending" };
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const body = (payload?.data ?? {}) as {
      event?: string;
      data?: Record<string, unknown>;
    };
    const culqiData = body?.data ?? {};
    const chargeId = culqiData?.id as string | undefined;
    const sessionId = (culqiData?.metadata as Record<string, unknown> | undefined)
      ?.medusa_session_id as string | undefined;
    // Eventos ajenos (sin metadata medusa_session_id) no se tocan — mismo
    // patrón que el provider oficial de Stripe contra cuentas compartidas.
    if (!sessionId || !chargeId) {
      return { action: "not_supported" };
    }
    // Webhooks Culqi no llevan firma documentada (docs/04): se valida
    // re-consultando el cargo por API antes de mutar el estado.
    const charge = await this.culqiRequest(`/charges/${chargeId}`, "GET");
    const outcome = chargeOutcomeType(charge);
    const amount = getAmountFromSmallestUnit(
      charge.amount as BigNumberInput,
      (charge.currency_code as string) ?? "pen"
    );
    if (outcome.startsWith("venta_exitosa")) {
      return { action: "captured", data: { session_id: sessionId, amount } };
    }
    return { action: "pending", data: { session_id: sessionId, amount } };
  }
}
