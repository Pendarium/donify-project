import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RnaLookupService } from '../../common/services/rna-lookup.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AssociationsController } from './associations.controller';
import { AssociationsService } from './associations.service';
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
  controllers: [AssociationsController],
  providers: [AssociationsService, JwtAuthGuard, RolesGuard, RnaLookupService],
  exports: [AssociationsService],
})
export class AssociationsModule {}
