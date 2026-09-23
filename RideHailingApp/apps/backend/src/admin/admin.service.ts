import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import {
  DateRangeQueryDto,
  DriverActionDto,
  DriverFilterDto,
  PaginationQueryDto,
  PaymentFilterDto,
  RideFilterDto,
  UpdateTicketDto,
} from './dto/admin-queries.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private parseDateBounds(dateRange: DateRangeQueryDto): { start: Date; end: Date } {
    const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    let start: Date;

    if (dateRange.range === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    } else if (dateRange.range === '30d') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange.range === 'custom' && dateRange.startDate) {
      start = new Date(dateRange.startDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format for custom range');
      }
      if (start > end) {
        throw new BadRequestException('startDate cannot be after endDate');
      }
    } else {
      // Default: 7d
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  // ==================== DASHBOARD OVERVIEW ====================
  async getDashboardOverview() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalPassengers,
      newPassengers24h,
      totalDrivers,
      approvedDrivers,
      pendingDrivers,
      suspendedDrivers,
      onlineDrivers,
      totalRides,
      requestedRides,
      acceptedRides,
      ongoingRides,
      completedRides,
      cancelledRides,
      paymentsSummary,
      activeNegotiations,
      ratingSummary,
      supportSummary,
      walletSum,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      this.prisma.driver.count(),
      this.prisma.driver.count({ where: { verificationStatus: 'approved' } }),
      this.prisma.driver.count({ where: { verificationStatus: 'pending' } }),
      this.prisma.driver.count({ where: { verificationStatus: 'suspended' } }),
      this.prisma.driver.count({ where: { isOnline: true } }),
      this.prisma.ride.count(),
      this.prisma.ride.count({ where: { status: 'requested' } }),
      this.prisma.ride.count({ where: { status: 'accepted' } }),
      this.prisma.ride.count({ where: { status: 'ongoing' } }),
      this.prisma.ride.count({ where: { status: 'completed' } }),
      this.prisma.ride.count({ where: { status: 'cancelled' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true, refundedAmount: true },
        _count: { id: true },
      }),
      this.prisma.negotiation.count({ where: { status: 'active' } }),
      this.prisma.rating.aggregate({
        _avg: { score: true },
        _count: { id: true },
      }),
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.wallet.aggregate({
        _sum: { balance: true },
        _count: { id: true },
      }),
    ]);

    const completedPayments = await this.prisma.payment.aggregate({
      where: { status: 'succeeded' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const pendingPayments = await this.prisma.payment.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      users: {
        totalPassengers,
        newPassengers24h,
      },
      drivers: {
        totalDrivers,
        approvedDrivers,
        pendingDrivers,
        suspendedDrivers,
        onlineDrivers,
      },
      rides: {
        totalRides,
        requestedRides,
        acceptedRides,
        ongoingRides,
        completedRides,
        cancelledRides,
      },
      financial: {
        currency: 'PKR',
        totalPaymentVolume: Number(paymentsSummary._sum.amount ?? 0),
        completedPaymentVolume: Number(completedPayments._sum.amount ?? 0),
        pendingPaymentVolume: Number(pendingPayments._sum.amount ?? 0),
        refundedAmount: Number(paymentsSummary._sum.refundedAmount ?? 0),
        totalPaymentsCount: paymentsSummary._count.id,
        completedPaymentsCount: completedPayments._count.id,
        totalWalletBalance: Number(walletSum._sum.balance ?? 0),
        totalWalletsCount: walletSum._count.id,
      },
      negotiations: {
        activeNegotiations,
      },
      ratings: {
        averageRating: ratingSummary._avg.score ? Number(ratingSummary._avg.score.toFixed(2)) : 0,
        totalRatings: ratingSummary._count.id,
      },
      support: {
        openTickets: supportSummary,
      },
    };
  }

  // ==================== DASHBOARD ANALYTICS ====================
  async getDashboardAnalytics(dateRange: DateRangeQueryDto) {
    const { start, end } = this.parseDateBounds(dateRange);

    const [
      ridesInRange,
      ridesByStatus,
      paymentsInRange,
      negotiationsInRange,
    ] = await Promise.all([
      this.prisma.ride.findMany({
        where: { requestedAt: { gte: start, lte: end } },
        select: {
          id: true,
          status: true,
          requestedAt: true,
          proposedFare: true,
          finalFare: true,
        },
      }),
      this.prisma.ride.groupBy({
        by: ['status'],
        where: { requestedAt: { gte: start, lte: end } },
        _count: { id: true },
      }),
      this.prisma.payment.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: {
          id: true,
          amount: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
      this.prisma.negotiation.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: { id: true },
      }),
    ]);

    // Aggregate daily buckets
    const dailyMap: Record<string, { date: string; rides: number; completedRides: number; revenuePKR: number }> = {};
    const curr = new Date(start);
    while (curr <= end) {
      const dateKey = curr.toISOString().slice(0, 10);
      dailyMap[dateKey] = { date: dateKey, rides: 0, completedRides: 0, revenuePKR: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    for (const r of ridesInRange) {
      const dateKey = r.requestedAt.toISOString().slice(0, 10);
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].rides += 1;
        if (r.status === 'completed') {
          dailyMap[dateKey].completedRides += 1;
        }
      }
    }

    for (const p of paymentsInRange) {
      if (p.status === 'succeeded') {
        const dateKey = p.createdAt.toISOString().slice(0, 10);
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].revenuePKR += Number(p.amount);
        }
      }
    }

    return {
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      dailyTrends: Object.values(dailyMap),
      ridesByStatus: ridesByStatus.map((s) => ({ status: s.status, count: s._count.id })),
      negotiationsByStatus: negotiationsInRange.map((n) => ({ status: n.status, count: n._count.id })),
      totalRidesInRange: ridesInRange.length,
      totalPaymentsInRange: paymentsInRange.length,
    };
  }

  // ==================== USER MANAGEMENT ====================
  async getUsers(query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'createdAt',
      name: 'name',
      rating: 'rating',
      rideCount: 'rideCount',
    };
    const orderByField = (query.sortBy && sortableFields[query.sortBy]) || 'createdAt';
    const orderBy = { [orderByField]: query.sortOrder === 'asc' ? 'asc' : 'desc' };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          phoneVerified: true,
          profilePhotoUrl: true,
          rating: true,
          rideCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetails(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        phoneVerified: true,
        profilePhotoUrl: true,
        rating: true,
        rideCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Passenger not found');
    }

    const [ridesCountByStatus, recentRides, wallet, payments] = await Promise.all([
      this.prisma.ride.groupBy({
        by: ['status'],
        where: { passengerId: id },
        _count: { id: true },
      }),
      this.prisma.ride.findMany({
        where: { passengerId: id },
        take: 10,
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          status: true,
          pickupAddress: true,
          dropoffAddress: true,
          proposedFare: true,
          finalFare: true,
          requestedAt: true,
          completedAt: true,
          driver: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      this.prisma.wallet.findUnique({
        where: { userId: id },
        include: {
          transactions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: { passengerId: id },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      profile: user,
      ridesSummary: ridesCountByStatus.map((s) => ({ status: s.status, count: s._count.id })),
      recentRides,
      wallet: wallet
        ? {
            id: wallet.id,
            balance: Number(wallet.balance),
            currency: wallet.currency,
            recentTransactions: wallet.transactions.map((t) => ({
              ...t,
              amount: Number(t.amount),
              balanceBefore: Number(t.balanceBefore),
              balanceAfter: Number(t.balanceAfter),
            })),
          }
        : null,
      recentPayments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        refundedAmount: Number(p.refundedAmount),
      })),
    };
  }

  // ==================== DRIVER MANAGEMENT ====================
  async getDrivers(query: DriverFilterDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    if (query.isOnline !== undefined) {
      where.isOnline = query.isOnline;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { vehicle: { registrationNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'createdAt',
      name: 'name',
      rating: 'rating',
    };
    const orderByField = (query.sortBy && sortableFields[query.sortBy]) || 'createdAt';
    const orderBy = { [orderByField]: query.sortOrder === 'asc' ? 'asc' : 'desc' };

    const [total, drivers] = await Promise.all([
      this.prisma.driver.count({ where }),
      this.prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          phoneVerified: true,
          profilePhotoUrl: true,
          verificationStatus: true,
          rating: true,
          isOnline: true,
          licenseNumber: true,
          cnicNumber: true,
          createdAt: true,
          updatedAt: true,
          vehicle: {
            select: {
              type: true,
              make: true,
              model: true,
              color: true,
              registrationNumber: true,
            },
          },
        },
      }),
    ]);

    return {
      data: drivers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDriverDetails(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        phoneVerified: true,
        profilePhotoUrl: true,
        licenseNumber: true,
        licenseDocFrontUrl: true,
        licenseDocBackUrl: true,
        cnicNumber: true,
        cnicDocUrl: true,
        verificationStatus: true,
        rating: true,
        isOnline: true,
        currentLat: true,
        currentLng: true,
        createdAt: true,
        updatedAt: true,
        vehicle: true,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const [ridesSummary, recentRides, supportTickets, wallet] = await Promise.all([
      this.prisma.ride.groupBy({
        by: ['status'],
        where: { driverId: id },
        _count: { id: true },
      }),
      this.prisma.ride.findMany({
        where: { driverId: id },
        take: 10,
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          status: true,
          pickupAddress: true,
          dropoffAddress: true,
          proposedFare: true,
          finalFare: true,
          requestedAt: true,
          completedAt: true,
          passenger: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      this.prisma.supportTicket.findMany({
        where: { driverId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wallet.findUnique({
        where: { userId: id },
      }),
    ]);

    return {
      driver,
      ridesSummary: ridesSummary.map((s) => ({ status: s.status, count: s._count.id })),
      recentRides,
      supportTickets,
      wallet: wallet
        ? {
            id: wallet.id,
            balance: Number(wallet.balance),
            currency: wallet.currency,
          }
        : null,
    };
  }

  async approveDriver(id: string, adminId: string, dto?: DriverActionDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: { verificationStatus: 'approved' },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        isOnline: true,
      },
    });

    await this.auditLog.record(adminId, 'DRIVER_APPROVED', 'driver', id, {
      previousStatus: driver.verificationStatus,
      newStatus: 'approved',
      reason: dto?.reason,
    });

    await this.prisma.notification.create({
      data: {
        driverId: id,
        title: 'Account Approved',
        message: 'Your driver account has been approved by an administrator. You can now go online and accept rides.',
        type: 'account',
      },
    });

    return updated;
  }

  async rejectDriver(id: string, adminId: string, dto?: DriverActionDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        verificationStatus: 'rejected',
        isOnline: false,
      },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        isOnline: true,
      },
    });

    await this.auditLog.record(adminId, 'DRIVER_REJECTED', 'driver', id, {
      previousStatus: driver.verificationStatus,
      newStatus: 'rejected',
      reason: dto?.reason,
    });

    await this.prisma.notification.create({
      data: {
        driverId: id,
        title: 'Account Verification Update',
        message: `Your driver application has been rejected.${dto?.reason ? ' Reason: ' + dto.reason : ''}`,
        type: 'account',
      },
    });

    return updated;
  }

  async suspendDriver(id: string, adminId: string, dto?: DriverActionDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        verificationStatus: 'suspended',
        isOnline: false,
      },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        isOnline: true,
      },
    });

    await this.auditLog.record(adminId, 'DRIVER_SUSPENDED', 'driver', id, {
      previousStatus: driver.verificationStatus,
      newStatus: 'suspended',
      reason: dto?.reason,
    });

    await this.prisma.notification.create({
      data: {
        driverId: id,
        title: 'Account Suspended',
        message: `Your driver account has been suspended by an administrator.${dto?.reason ? ' Reason: ' + dto.reason : ''}`,
        type: 'account',
      },
    });

    return updated;
  }

  // ==================== RIDE MANAGEMENT ====================
  async getRides(query: RideFilterDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.passengerId) {
      where.passengerId = query.passengerId;
    }
    if (query.driverId) {
      where.driverId = query.driverId;
    }
    if (query.startDate || query.endDate) {
      where.requestedAt = {};
      if (query.startDate) where.requestedAt.gte = new Date(query.startDate);
      if (query.endDate) where.requestedAt.lte = new Date(query.endDate);
    }
    if (query.search) {
      where.OR = [
        { id: { contains: query.search } },
        { pickupAddress: { contains: query.search, mode: 'insensitive' } },
        { dropoffAddress: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, rides] = await Promise.all([
      this.prisma.ride.count({ where }),
      this.prisma.ride.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          passenger: {
            select: { id: true, name: true, phone: true },
          },
          driver: {
            select: { id: true, name: true, phone: true },
          },
          payment: {
            select: { id: true, status: true, amount: true, paymentMethod: true },
          },
        },
      }),
    ]);

    return {
      data: rides.map((r) => ({
        ...r,
        proposedFare: Number(r.proposedFare),
        aiRecommendedFare: Number(r.aiRecommendedFare),
        finalFare: r.finalFare ? Number(r.finalFare) : null,
        payment: r.payment
          ? {
              ...r.payment,
              amount: Number(r.payment.amount),
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRideDetails(id: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            profilePhotoUrl: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            profilePhotoUrl: true,
            verificationStatus: true,
            vehicle: true,
          },
        },
        payment: true,
        negotiations: {
          include: {
            offers: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        ratings: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    return {
      ...ride,
      proposedFare: Number(ride.proposedFare),
      aiRecommendedFare: Number(ride.aiRecommendedFare),
      finalFare: ride.finalFare ? Number(ride.finalFare) : null,
      payment: ride.payment
        ? {
            ...ride.payment,
            amount: Number(ride.payment.amount),
            refundedAmount: Number(ride.payment.refundedAmount),
          }
        : null,
      negotiations: ride.negotiations.map((n) => ({
        ...n,
        currentAmount: Number(n.currentAmount),
        offers: n.offers.map((o) => ({
          ...o,
          amount: Number(o.amount),
        })),
      })),
    };
  }

  // ==================== NEGOTIATION MONITORING ====================
  async getNegotiations(query: PaginationQueryDto & { status?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { rideId: { contains: query.search } },
        { passenger: { name: { contains: query.search, mode: 'insensitive' } } },
        { driver: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, negotiations] = await Promise.all([
      this.prisma.negotiation.count({ where }),
      this.prisma.negotiation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          passenger: {
            select: { id: true, name: true, phone: true },
          },
          driver: {
            select: { id: true, name: true, phone: true },
          },
          ride: {
            select: {
              id: true,
              status: true,
              proposedFare: true,
              finalFare: true,
              pickupAddress: true,
              dropoffAddress: true,
            },
          },
          offers: {
            select: { id: true },
          },
        },
      }),
    ]);

    return {
      data: negotiations.map((n) => ({
        id: n.id,
        rideId: n.rideId,
        status: n.status,
        currentAmount: Number(n.currentAmount),
        currentProposerId: n.currentProposerId,
        passenger: n.passenger,
        driver: n.driver,
        ride: {
          ...n.ride,
          proposedFare: Number(n.ride.proposedFare),
          finalFare: n.ride.finalFare ? Number(n.ride.finalFare) : null,
        },
        roundsCount: n.offers.length,
        expiresAt: n.expiresAt,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getNegotiationDetails(id: string) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        ride: true,
        offers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException('Negotiation session not found');
    }

    return {
      ...negotiation,
      currentAmount: Number(negotiation.currentAmount),
      ride: {
        ...negotiation.ride,
        proposedFare: Number(negotiation.ride.proposedFare),
        aiRecommendedFare: Number(negotiation.ride.aiRecommendedFare),
        finalFare: negotiation.ride.finalFare ? Number(negotiation.ride.finalFare) : null,
      },
      offers: negotiation.offers.map((o) => ({
        ...o,
        amount: Number(o.amount),
      })),
    };
  }

  // ==================== PAYMENTS & FINANCIAL ====================
  async getPayments(query: PaymentFilterDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    if (query.search) {
      where.OR = [
        { id: { contains: query.search } },
        { rideId: { contains: query.search } },
        { idempotencyKey: { contains: query.search } },
      ];
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ride: {
            select: {
              pickupAddress: true,
              dropoffAddress: true,
              status: true,
              passenger: { select: { id: true, name: true, phone: true } },
              driver: { select: { id: true, name: true, phone: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        refundedAmount: Number(p.refundedAmount),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFinancialOverview(dateRange: DateRangeQueryDto) {
    const { start, end } = this.parseDateBounds(dateRange);

    const [
      totalVolume,
      completedVolume,
      pendingVolume,
      refundedVolume,
      paymentMethodBreakdown,
      walletTotals,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'succeeded',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'pending',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { refundedAmount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['paymentMethod', 'status'],
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.wallet.aggregate({
        _sum: { balance: true },
        _count: { id: true },
      }),
    ]);

    return {
      currency: 'PKR',
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      grossRideValue: Number(totalVolume._sum.amount ?? 0),
      completedPaymentVolume: Number(completedVolume._sum.amount ?? 0),
      pendingPaymentVolume: Number(pendingVolume._sum.amount ?? 0),
      refundedAmount: Number(refundedVolume._sum.refundedAmount ?? 0),
      totalTransactions: totalVolume._count.id,
      completedTransactions: completedVolume._count.id,
      totalSystemWalletBalance: Number(walletTotals._sum.balance ?? 0),
      breakdown: paymentMethodBreakdown.map((b) => ({
        method: b.paymentMethod,
        status: b.status,
        amount: Number(b._sum.amount ?? 0),
        count: b._count.id,
      })),
    };
  }

  // ==================== WALLET & LEDGER MONITORING ====================
  async getWallets(query: PaginationQueryDto & { userRole?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userRole) {
      where.userRole = query.userRole;
    }

    const [total, wallets] = await Promise.all([
      this.prisma.wallet.count({ where }),
      this.prisma.wallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Populate user names safely
    const userIds = wallets.filter((w) => w.userRole === 'passenger').map((w) => w.userId);
    const driverIds = wallets.filter((w) => w.userRole === 'driver').map((w) => w.userId);

    const [passengers, drivers] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, phone: true },
      }),
      this.prisma.driver.findMany({
        where: { id: { in: driverIds } },
        select: { id: true, name: true, phone: true },
      }),
    ]);

    const userMap = new Map(passengers.map((p) => [p.id, p]));
    const driverMap = new Map(drivers.map((d) => [d.id, d]));

    const enriched = wallets.map((w) => {
      const entity = w.userRole === 'passenger' ? userMap.get(w.userId) : driverMap.get(w.userId);
      return {
        id: w.id,
        userId: w.userId,
        userRole: w.userRole,
        balance: Number(w.balance),
        currency: w.currency,
        userName: entity?.name || 'Unknown',
        userPhone: entity?.phone || '',
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      };
    });

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWalletTransactions(
    query: PaginationQueryDto & { walletId?: string; userId?: string; type?: any },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.walletId) where.walletId = query.walletId;
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;

    const [total, txs] = await Promise.all([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: txs.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== RATINGS MONITORING ====================
  async getRatings(query: PaginationQueryDto & { minScore?: number; maxScore?: number; role?: any }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.fromRole = query.role;
    if (query.minScore || query.maxScore) {
      where.score = {};
      if (query.minScore) where.score.gte = Number(query.minScore);
      if (query.maxScore) where.score.lte = Number(query.maxScore);
    }

    const [total, ratings] = await Promise.all([
      this.prisma.rating.count({ where }),
      this.prisma.rating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ride: {
            select: {
              id: true,
              pickupAddress: true,
              dropoffAddress: true,
              passenger: { select: { id: true, name: true } },
              driver: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: ratings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== SUPPORT TICKETS ====================
  async getSupportTickets(query: PaginationQueryDto & { status?: any; category?: any }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    const [total, tickets] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          driver: {
            select: { id: true, name: true, phone: true },
          },
          ride: {
            select: { id: true, status: true, pickupAddress: true, dropoffAddress: true },
          },
        },
      }),
    ]);

    return {
      data: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateSupportTicket(id: string, adminId: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.auditLog.record(adminId, 'SUPPORT_TICKET_UPDATED', 'support_ticket', id, {
      previousStatus: ticket.status,
      newStatus: dto.status,
    });

    return updated;
  }
}
