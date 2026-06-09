/** Small deterministic formatting helpers shared across the engine. */

export function formatMoney(amount: number | null, currency = "USD"): string {
  if (amount === null || Number.isNaN(amount)) return "an unspecified amount";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown currency code → fall back to a plain rendering.
    return `${currency} ${amount.toFixed(2)}`;
  }
}
