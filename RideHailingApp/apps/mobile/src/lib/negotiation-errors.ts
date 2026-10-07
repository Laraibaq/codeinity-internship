import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-client";

// What the user should be told when accepting / countering / rejecting a negotiation offer fails.
// `refresh` tells the screen it is now showing stale data and should re-fetch immediately.
export interface NegotiationFailure {
  message: string;
  refresh: boolean;
}

export function describeNegotiationError(
  error: unknown,
  role: "passenger" | "driver",
  fallback: string,
): NegotiationFailure {
  switch (getApiErrorCode(error)) {
    case "OFFER_EXPIRED":
      return {
        message:
          role === "passenger"
            ? "That offer has expired. Pick another driver or wait for a new offer."
            : "That offer has expired. You can send a new counter-offer.",
        refresh: true,
      };
    case "PRICE_CHANGED":
      return {
        message:
          role === "passenger"
            ? "The driver changed their price. Review the updated offer before accepting."
            : "The passenger changed their price. Review the updated offer before accepting.",
        refresh: true,
      };
    case "RIDE_TAKEN":
    case "RIDE_UNAVAILABLE":
      return {
        message:
          role === "passenger"
            ? "This ride has already been assigned or is no longer available."
            : "This ride has already been taken by another driver or is no longer available.",
        refresh: true,
      };
    case "DRIVER_BUSY":
      return {
        message:
          role === "passenger"
            ? "That driver just took another ride. Choose a different driver."
            : "You are already on another ride.",
        refresh: true,
      };
    case "OFFER_OUT_OF_RANGE":
      return { message: getApiErrorMessage(error, fallback), refresh: false };
    default:
      return { message: getApiErrorMessage(error, fallback), refresh: false };
  }
}
