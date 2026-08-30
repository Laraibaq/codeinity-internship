// Registration/login phone inputs accept punctuated US-style input ("(555) 000-0000"), but the
// backend's phone field must match `^\+?[1-9]\d{7,14}$` (digits only, optional leading +) and the
// SAME normalized value must be reused for register -> otp/request -> otp/verify, since the
// backend looks records up by exact string match. Strips everything but digits and a leading "+",
// then assumes a US country code if none was given -- matching verify-phone.tsx's existing "+1 "
// display convention for the same field.
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+1${digits}` : "";
}
