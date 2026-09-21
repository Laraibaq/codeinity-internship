import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import type {
  OfferCreatedEvent,
  OfferUpdatedEvent,
  RideAcceptedEvent,
  RideStatusChangedEvent,
} from './realtime-events.interface';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RealtimeGateway) {}

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
}
