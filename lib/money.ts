/**
 * Money is always an integer number of pesewas (1 GHS = 100 pesewas).
 * Never represent money as a float — see docs/adr for the rationale.
 */
export type Pesewas = number;

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(
      `${label} must be an integer number of pesewas, received ${value}`,
    );
  }
}

export function addMoney(...amounts: Pesewas[]): Pesewas {
  return amounts.reduce((total, amount) => {
    assertInteger(amount, "amount");
    return total + amount;
  }, 0);
}

export function multiplyMoney(amount: Pesewas, quantity: number): Pesewas {
  assertInteger(amount, "amount");
  assertInteger(quantity, "quantity");
  if (quantity < 0) {
    throw new RangeError(`quantity must not be negative, received ${quantity}`);
  }
  return amount * quantity;
}

export function formatPesewas(
  amount: Pesewas,
  currency = "GHS",
  locale = "en-GH",
): string {
  assertInteger(amount, "amount");
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount / 100);
}
