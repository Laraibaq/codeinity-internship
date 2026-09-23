import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import type {
  DriverLocationUpdatedEvent,
  OfferCreatedEvent,
  OfferUpdatedEvent,
  RideAcceptedEvent,
  RideStatusChangedEvent,
  NegotiationOfferCreatedEvent,
  NegotiationAcceptedEvent,
  NegotiationRejectedEvent,
} from './realtime-events.interface';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

  emitDriverLocationUpdated(
    event: DriverLocationUpdatedEvent,
    targets: { passengerId: string; driverId: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitDriverLocationUpdated');
      return;
    }

    this.logger.log(
      `Emitting driver:location-updated for ride ${event.rideId}, driver ${event.driverId}: (${event.lat}, ${event.lng})`,
    );

    // Emit to authorized ride room
    this.gateway.server.to(`ride:${event.rideId}`).emit('driver:location-updated', event);

    // Also emit to passenger private room to ensure delivery during room reconnects
    this.gateway.server.to(`user:${targets.passengerId}`).emit('driver:location-updated', event);
  }

  emitOfferCreated(
    event: OfferCreatedEvent,
    targets: { driverId: string; passengerId: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitOfferCreated');
      return;
    }

    this.logger.log(
      `Emitting ride:offer-created for ride ${event.rideId}, offer ${event.offerId} to driver ${targets.driverId} & passenger ${targets.passengerId}`,
    );

    // Emit to passenger private room
    this.gateway.server.to(`user:${targets.passengerId}`).emit('ride:offer-created', event);

    // Emit to driver private rooms
    this.gateway.server.to(`user:${targets.driverId}`).emit('ride:offer-created', event);
    this.gateway.server.to(`driver:${targets.driverId}`).emit('ride:offer-created', event);

    // Emit to ride room
    this.gateway.server.to(`ride:${event.rideId}`).emit('ride:offer-created', event);
  }

  emitOfferUpdated(
    event: OfferUpdatedEvent,
    targets?: { driverId?: string; passengerId?: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitOfferUpdated');
      return;
    }

    this.logger.log(
      `Emitting ride:offer-updated for ride ${event.rideId}, offer ${event.offerId}, status ${event.status}`,
    );

    this.gateway.server.to(`ride:${event.rideId}`).emit('ride:offer-updated', event);

    if (targets?.passengerId) {
      this.gateway.server.to(`user:${targets.passengerId}`).emit('ride:offer-updated', event);
    }
    if (targets?.driverId) {
      this.gateway.server.to(`user:${targets.driverId}`).emit('ride:offer-updated', event);
      this.gateway.server.to(`driver:${targets.driverId}`).emit('ride:offer-updated', event);
    }
  }

  emitRideAccepted(
    event: RideAcceptedEvent,
    targets: { passengerId: string; driverId: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitRideAccepted');
      return;
    }

    this.logger.log(
      `Emitting ride:accepted for ride ${event.rideId} with driver ${event.driverId}`,
    );

    this.gateway.server.to(`ride:${event.rideId}`).emit('ride:accepted', event);
    this.gateway.server.to(`user:${targets.passengerId}`).emit('ride:accepted', event);
    this.gateway.server.to(`user:${targets.driverId}`).emit('ride:accepted', event);
    this.gateway.server.to(`driver:${targets.driverId}`).emit('ride:accepted', event);
  }

  emitRideStatusChanged(
    event: RideStatusChangedEvent,
    targets?: { passengerId?: string; driverId?: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitRideStatusChanged');
      return;
    }

    this.logger.log(
      `Emitting ride:status-changed for ride ${event.rideId} -> ${event.status}`,
    );

    this.gateway.server.to(`ride:${event.rideId}`).emit('ride:status-changed', event);

    if (targets?.passengerId) {
      this.gateway.server.to(`user:${targets.passengerId}`).emit('ride:status-changed', event);
    }
    if (targets?.driverId) {
      this.gateway.server.to(`user:${targets.driverId}`).emit('ride:status-changed', event);
      this.gateway.server.to(`driver:${targets.driverId}`).emit('ride:status-changed', event);
    }
  }

  emitPaymentStatusChanged(
    event: import('./realtime-events.interface').PaymentStatusChangedEvent,
    targets: { passengerId: string; driverId: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitPaymentStatusChanged');
      return;
    }

    this.logger.log(
      `Emitting payment:status-changed for ride ${event.rideId} -> ${event.status}`,
    );

    this.gateway.server.to(`ride:${event.rideId}`).emit('payment:status-changed', event);
    this.gateway.server.to(`user:${targets.passengerId}`).emit('payment:status-changed', event);
    this.gateway.server.to(`user:${targets.driverId}`).emit('payment:status-changed', event);
  }

  emitNegotiationOfferCreated(
    event: NegotiationOfferCreatedEvent,
    targets: { passengerId: string; driverId: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitNegotiationOfferCreated');
      return;
    }

    this.logger.log(
      `Emitting negotiation:offer-created for ride ${event.rideId} (proposer=${event.proposerRole}, amount=${event.amount})`,
    );

    this.gateway.server.to(`ride:${event.rideId}`).emit('negotiation:offer-created', event);
    this.gateway.server.to(`user:${targets.passengerId}`).emit('negotiation:offer-created', event);
    this.gateway.server.to(`user:${targets.driverId}`).emit('negotiation:offer-created', event);
  }

  emitNegotiationAccepted(
    event: NegotiationAcceptedEvent,
    targets: { passengerId: string; driverId: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitNegotiationAccepted');
      return;
    }

    this.logger.log(
      `Emitting negotiation:accepted for ride ${event.rideId} -> finalFare=${event.finalFare}`,
    );

    this.gateway.server.to(`ride:${event.rideId}`).emit('negotiation:accepted', event);
    this.gateway.server.to(`user:${targets.passengerId}`).emit('negotiation:accepted', event);
    this.gateway.server.to(`user:${targets.driverId}`).emit('negotiation:accepted', event);
  }

  emitNegotiationRejected(
    event: NegotiationRejectedEvent,
    targets: { passengerId: string; driverId: string },
  ) {
    if (!this.gateway.server) {
      this.logger.warn('WebSocket server not initialized; skipping emitNegotiationRejected');
      return;
    }

    this.logger.log(
      `Emitting negotiation:rejected for ride ${event.rideId}`,
    );

    this.gateway.server.to(`ride:${event.rideId}`).emit('negotiation:rejected', event);
    this.gateway.server.to(`user:${targets.passengerId}`).emit('negotiation:rejected', event);
    this.gateway.server.to(`user:${targets.driverId}`).emit('negotiation:rejected', event);
  }
}
