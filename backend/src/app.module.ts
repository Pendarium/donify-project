import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AssociationsModule } from './modules/associations/associations.module';
import { VolunteerOffersModule } from './modules/volunteer-offers/volunteer-offers.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { validateEnv } from './config/env.validation';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AssociationsModule,
    VolunteerOffersModule,
    ReviewsModule,
  ],
})
export class AppModule {}