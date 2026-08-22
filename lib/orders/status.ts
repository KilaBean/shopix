/** orders.status (fulfillment) values -- never payment_status, see order-actions.ts. */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];
