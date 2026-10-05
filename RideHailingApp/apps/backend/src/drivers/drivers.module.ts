import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RidesModule } from '../rides/rides.module';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { NearbyDriversController } from './nearby-drivers.controller';

@Module({
  imports: [AuthModule, PrismaModule, RealtimeModule, RidesModule],
  controllers: [DriversController, NearbyDriversController],
  providers: [DriversService],
})
export class DriversModule {}
