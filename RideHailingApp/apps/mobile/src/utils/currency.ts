// MVP1 policy: cash-only, no online payment methods. Do not add payment-method-selection UI
// until MVP3 (see Features_and_MVP.docx §8).

// Fares are always PKR regardless of the device's locale/region, so a phone configured for another
// country never shows "$" (or any other currency) for a Pakistani fare.
const formatter = new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR" });

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}
