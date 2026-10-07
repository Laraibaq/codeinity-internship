import type { NegotiationSession } from "@/lib/api/negotiation";
import type { DriverOffer } from "@/store/passenger/passenger-ride-store";

export interface PendingCounter {
  driverName: string;
  amount: number;
}

export interface PassengerBids {
  // Driver counter-offers awaiting the passenger. `id` is the NegotiationOffer id, i.e. exactly
  // what POST /rides/:id/negotiation/accept/:offerId takes.
  bids: DriverOffer[];
  // Passenger counters the driver has not answered yet.
  waiting: PendingCounter[];
}

// A bid is the latest pending offer in an active negotiation that the DRIVER proposed. Everything
// shown on the card comes from the negotiation payload; fields the server could not supply (ETA,
// rating, plate) stay null/empty rather than being filled with placeholders.
export function bidsFromNegotiations(sessions: NegotiationSession[], now = Date.now()): PassengerBids {
  const bids: DriverOffer[] = [];
  const waiting: PendingCounter[] = [];

  for (const s of sessions) {
    if (s.status !== "active") continue;
    const latest = s.offers.find((o) => o.status === "pending" && new Date(o.expiresAt).getTime() > now);
    if (!latest) continue;

    if (latest.proposerId === s.driverId) {
      const v = s.driver?.vehicle;
      bids.push({
        id: latest.id,
        negotiationId: s.id,
        driverId: s.driverId,
        driverName: s.driver?.name ?? "Driver",
        driverRating: typeof s.driver?.rating === "number" ? s.driver.rating : null,
        vehicleModel: [v?.make, v?.model].filter(Boolean).join(" "),
        vehiclePlate: v?.registrationNumber ?? null,
        vehicleColor: v?.color ?? undefined,
        offeredFare: Number(latest.amount),
        estimatedArrivalMinutes: s.etaMinutes ?? null,
        expiresAt: latest.expiresAt,
      });
    } else {
      waiting.push({ driverName: s.driver?.name ?? "the driver", amount: Number(latest.amount) });
    }
  }

  return { bids, waiting };
}
