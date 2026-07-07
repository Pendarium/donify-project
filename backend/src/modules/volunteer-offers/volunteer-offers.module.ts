import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { VolunteerOffersController } from './volunteer-offers.controller';
import { VolunteerOffersService } from './volunteer-offers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [VolunteerOffersController],
  providers: [VolunteerOffersService, JwtAuthGuard, RolesGuard],
  exports: [VolunteerOffersService],
})
export class VolunteerOffersModule {}
