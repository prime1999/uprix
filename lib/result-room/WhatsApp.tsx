/** Used when a stored number starts with 0 (e.g. 0803…) and has no country code. */
export const DEFAULT_COUNTRY_CODE = "234";

/**
 * Turns a stored phone number into the digits-only international format
 * WhatsApp needs (no +, spaces or leading zero). Returns null if unusable.
 *
 *   "0803 123 4567"   -> "2348031234567"
 *   "+234 803 123 4567" -> "2348031234567"
 *   "2348031234567"   -> "2348031234567"
 */
export function toWhatsAppNumber(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;

  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  } else if (digits.length === 10) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/** wa.me link that opens a chat with the message already typed in. */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string,
): string | null {
  const number = toWhatsAppNumber(phone);

  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}
