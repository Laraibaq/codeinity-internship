import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DriversModule } from './drivers/drivers.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule, AuthModule, DriversModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
