import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { AdminService } from './admin.service';
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

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ==================== DASHBOARD & ANALYTICS ====================
  @Get('dashboard/overview')
  getDashboardOverview() {
    return this.adminService.getDashboardOverview();
  }

  @Get('dashboard/analytics')
  getDashboardAnalytics(@Query() query: DateRangeQueryDto) {
    return this.adminService.getDashboardAnalytics(query);
  }

  // ==================== USERS ====================
  @Get('users')
  getUsers(@Query() query: PaginationQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  // ==================== DRIVERS ====================
  @Get('drivers')
  getDrivers(@Query() query: DriverFilterDto) {
    return this.adminService.getDrivers(query);
  }

  @Get('drivers/:id')
  getDriverDetails(@Param('id') id: string) {
    return this.adminService.getDriverDetails(id);
  }

  @Post('drivers/:id/approve')
  approveDriver(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DriverActionDto,
  ) {
    return this.adminService.approveDriver(id, user.sub, dto);
  }

  @Post('drivers/:id/reject')
  rejectDriver(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DriverActionDto,
  ) {
    return this.adminService.rejectDriver(id, user.sub, dto);
  }

  @Post('drivers/:id/suspend')
  suspendDriver(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DriverActionDto,
  ) {
    return this.adminService.suspendDriver(id, user.sub, dto);
  }

  // ==================== RIDES ====================
  @Get('rides')
  getRides(@Query() query: RideFilterDto) {
    return this.adminService.getRides(query);
  }

  @Get('rides/:id')
  getRideDetails(@Param('id') id: string) {
    return this.adminService.getRideDetails(id);
  }

  // ==================== NEGOTIATIONS ====================
  @Get('negotiations')
  getNegotiations(
    @Query() query: PaginationQueryDto & { status?: string },
  ) {
    return this.adminService.getNegotiations(query);
  }

  @Get('negotiations/:id')
  getNegotiationDetails(@Param('id') id: string) {
    return this.adminService.getNegotiationDetails(id);
  }

  // ==================== FINANCIAL & PAYMENTS ====================
  @Get('payments')
  getPayments(@Query() query: PaymentFilterDto) {
    return this.adminService.getPayments(query);
  }

  @Get('financial/overview')
  getFinancialOverview(@Query() query: DateRangeQueryDto) {
    return this.adminService.getFinancialOverview(query);
  }

  // ==================== WALLETS & LEDGER ====================
  @Get('wallets')
  getWallets(@Query() query: PaginationQueryDto & { userRole?: string }) {
    return this.adminService.getWallets(query);
  }

  @Get('wallet-transactions')
  getWalletTransactions(
    @Query() query: PaginationQueryDto & { walletId?: string; userId?: string; type?: string },
  ) {
    return this.adminService.getWalletTransactions(query);
  }

  // ==================== RATINGS ====================
  @Get('ratings')
  getRatings(
    @Query() query: PaginationQueryDto & { minScore?: number; maxScore?: number; role?: string },
  ) {
    return this.adminService.getRatings(query);
  }

  // ==================== SUPPORT TICKETS ====================
  @Get('support-tickets')
  getSupportTickets(
    @Query() query: PaginationQueryDto & { status?: string; category?: string },
  ) {
    return this.adminService.getSupportTickets(query);
  }

  @Patch('support-tickets/:id')
  updateSupportTicket(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.adminService.updateSupportTicket(id, user.sub, dto);
  }

  // ==================== AUDIT LOGS ====================
  @Get('audit-logs')
  getAuditLogs(
    @Query() query: PaginationQueryDto & { action?: string; entityType?: string },
  ) {
    return this.auditLogService.getLogs(query);
  }
}
