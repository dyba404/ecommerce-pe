// Workflow REQ-NOT-01: email de confirmación cuando se coloca una orden.
// Usa sendNotificationsStep first-party (core-flows 2.21.1) con
// idempotency_key para no duplicar el email ante reintentos del event bus.
// Todo cálculo va en transform() y cada step lleva nombre único (reglas de
// lint @medusajs de workflows).
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  sendNotificationsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

type WorkflowInput = {
  id: string
}

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "item_subtotal",
        "items.*",
        "shipping_address.*",
      ],
      filters: { id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "query-order-placed" })

    const { data: stores } = useQueryGraphStep({
      entity: "store",
      fields: ["id", "name"],
    }).config({ name: "query-store-name" })

    const payload = transform({ orders, stores }, ({ orders, stores }) => {
      const order = orders[0]
      return {
        to: order.email!,
        channel: "email",
        template: "order-placed",
        data: {
          order,
          store_name: stores[0]?.name,
        },
        trigger_type: "order.placed",
        resource_id: order.id,
        resource_type: "order",
        idempotency_key: `order-placed-${order.id}`,
      }
    })

    const notification = when({ orders }, (data) => !!data.orders[0].email).then(
      () => sendNotificationsStep([payload])
    )

    return new WorkflowResponse({ notification })
  }
)
