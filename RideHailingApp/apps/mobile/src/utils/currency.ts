// MVP1 policy: cash-only, no online payment methods. Do not add payment-method-selection UI
// until MVP3 (see Features_and_MVP.docx §8).

import { getLocales } from "expo-localization";

const FALLBACK_LOCALE = "en-PK";
const FALLBACK_CURRENCY = "PKR";

export function formatCurrency(amount: number): string {
  let locale = FALLBACK_LOCALE;
  let currency = FALLBACK_CURRENCY;

  try {
    const [device] = getLocales();
    if (device?.languageTag) locale = device.languageTag;
    if (device?.currencyCode) currency = device.currencyCode;
  } catch {
    // getLocales() can throw on platforms without locale support; keep the Pakistan-first
    // fallback rather than letting a formatting helper crash the screen that calls it.
  }

  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    // Intl.NumberFormat throws on an unrecognized currency/locale combination; retry once
    // with the fallback instead of propagating the error.
    return new Intl.NumberFormat(FALLBACK_LOCALE, {
      style: "currency",
      currency: FALLBACK_CURRENCY,
    }).format(amount);
  }
}
