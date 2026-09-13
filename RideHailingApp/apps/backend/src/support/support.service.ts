import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

export const SUPPORT_FAQS = [
  {
    question: 'How do I get paid?',
    answer:
      'This MVP is cash-only -- riders pay you directly at the end of each trip. Digital payouts and a Withdraw flow are planned for a later release.',
  },
  {
    question: 'Why is my Documents status still pending?',
    answer:
      'Document review is manual right now. You will see the status change on the Documents screen once it is checked -- there is no fixed turnaround time yet.',
  },
  {
    question: 'Can I drive a bike or rickshaw?',
    answer:
      'Not yet. Only cars are supported in this MVP; bike and rickshaw support is planned for a future update.',
  },
  {
    question: 'How is my rating calculated?',
    answer:
      'Your rating is the average of your passenger reviews, shown on the Ratings & Reviews screen along with the star breakdown.',
  },
];

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  getFaqs() {
    return SUPPORT_FAQS;
  }

  async createTicket(driverId: string, dto: CreateSupportTicketDto) {
    if (dto.rideId) {
      const ride = await this.prisma.ride.findUnique({
        where: { id: dto.rideId },
      });

      if (!ride) {
        throw new NotFoundException('Ride not found');
      }

      if (ride.driverId && ride.driverId !== driverId) {
        throw new ForbiddenException('Ride belongs to another driver');
      }
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        driverId,
        rideId: dto.rideId,
        category: dto.category as any,
        subject: dto.subject,
        description: dto.description,
        status: 'open',
      },
    });

    // Generate real confirmation notification
    await this.prisma.notification.create({
      data: {
        driverId,
        title: 'Support request received',
        message: `Your report regarding "${dto.subject}" has been received. Our support team will follow up if needed.`,
        type: 'support',
        isRead: false,
      },
    });

    return ticket;
  }

  async getTickets(driverId: string) {
    return this.prisma.supportTicket.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      include: {
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            status: true,
          },
        },
      },
    });
  }
}
