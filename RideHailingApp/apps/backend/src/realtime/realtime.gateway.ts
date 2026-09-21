import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt-payload.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit() {
    this.logger.log('Socket.IO Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const rawToken =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization;

      if (!rawToken || typeof rawToken !== 'string') {
        this.logger.warn(`Client ${client.id} connection rejected: missing token`);
        client.emit('error', 'Unauthorized: missing token');
        client.disconnect(true);
        return;
      }

      const token = rawToken.startsWith('Bearer ')
        ? rawToken.slice(7).trim()
        : rawToken.trim();

      const secret = process.env.JWT_ACCESS_SECRET;
      if (!secret) {
        this.logger.error('JWT_ACCESS_SECRET is not configured');
        client.disconnect(true);
        return;
      }

      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      if (!payload || !payload.sub || !payload.role) {
        this.logger.warn(`Client ${client.id} connection rejected: invalid payload`);
        client.emit('error', 'Unauthorized: invalid token payload');
        client.disconnect(true);
        return;
      }

      // Attach authenticated identity to socket instance
      client.data.user = {
        userId: payload.sub,
        role: payload.role,
      };

      // Automatically join user's private rooms
      await client.join(`user:${payload.sub}`);
      if (payload.role === 'driver') {
        await client.join(`driver:${payload.sub}`);
      }

      this.logger.log(
        `Client ${client.id} authenticated as ${payload.role} (${payload.sub})`,
      );
      client.emit('authenticated', {
        userId: payload.sub,
        role: payload.role,
      });
    } catch (err: any) {
      this.logger.warn(
        `Client ${client.id} authentication failed: ${err.message}`,
      );
      client.emit('error', 'Unauthorized: invalid token');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    this.logger.log(
      `Client ${client.id} disconnected ${
        user ? `(user ${user.userId})` : ''
      }`,
    );
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const user = client.data?.user;
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const room = data?.room;
    if (!room || typeof room !== 'string') {
      return { success: false, error: 'Invalid room identifier' };
    }

    // 1. User private room: strictly own ID
    if (room.startsWith('user:')) {
      const targetUserId = room.slice(5);
      if (targetUserId !== user.userId) {
        return { success: false, error: 'Forbidden: cannot join another user room' };
      }
      await client.join(room);
      return { success: true, room };
    }

    // 2. Driver private room: strictly own ID and driver role
    if (room.startsWith('driver:')) {
      const targetDriverId = room.slice(7);
      if (user.role !== 'driver' || targetDriverId !== user.userId) {
        return { success: false, error: 'Forbidden: cannot join another driver room' };
      }
      await client.join(room);
      return { success: true, room };
    }

    // 3. Ride room: verify authorization against database
    if (room.startsWith('ride:')) {
      const rideId = room.slice(5);
      try {
        const ride = await this.prisma.ride.findUnique({
          where: { id: rideId },
          include: {
            offers: {
              where: { driverId: user.userId },
            },
          },
        });

        if (!ride) {
          return { success: false, error: 'Ride not found' };
        }

        if (user.role === 'passenger') {
          if (ride.passengerId !== user.userId) {
            return {
              success: false,
              error: "Forbidden: cannot join another passenger's ride",
            };
          }
        } else if (user.role === 'driver') {
          const isAssigned = ride.driverId === user.userId;
          const hasOffer = ride.offers.length > 0;
          const isAvailable =
            (ride.status === 'requested' || ride.status === 'offered') &&
            ride.driverId === null;

          if (!isAssigned && !hasOffer && !isAvailable) {
            return {
              success: false,
              error: 'Forbidden: not authorized for this ride',
            };
          }
        } else {
          return { success: false, error: 'Forbidden: unauthorized role' };
        }

        await client.join(room);
        return { success: true, room };
      } catch (err: any) {
        this.logger.error(`Error verifying ride room authorization: ${err.message}`);
        return { success: false, error: 'Server error authorizing room' };
      }
    }

    return { success: false, error: 'Forbidden: unrecognized room prefix' };
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    if (data?.room && typeof data.room === 'string') {
      await client.leave(data.room);
      return { success: true, room: data.room };
    }
    return { success: false };
  }
}
