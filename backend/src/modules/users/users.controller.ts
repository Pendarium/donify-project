import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateAssociationReviewDto } from './dto/create-association-review.dto';
import { CreateVolunteerApplicationDto } from './dto/create-volunteer-application.dto';
import { CreateVolunteerBookingDto } from './dto/create-volunteer-booking.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  getProfile(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.findById(userId);
  }

  @Patch('profile')
  updateProfile(@Req() req: { user?: { sub?: string } }, @Body() body: UpdateProfileDto) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.updateProfile(userId, body);
  }

  @Delete('profile')
  deleteProfile(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.deleteAccount(userId);
  }

  @Get('volunteers/:id')
  @Roles('association', 'admin')
  getVolunteerProfile(
    @Param('id') id: string,
    @Req() req: { user?: { sub?: string; role?: string } },
  ) {
    const requester = req.user;

    if (!requester?.sub) {
      return null;
    }

    if (requester.role === 'admin') {
      return this.usersService.findById(id);
    }

    return this.usersService.findVolunteerProfileForAssociation(requester.sub, id);
  }

  @Post(':id/association-review')
  @Roles('association', 'admin')
  createAssociationReview(
    @Param('id') id: string,
    @Req() req: { user?: { sub?: string } },
    @Body() body: CreateAssociationReviewDto,
  ) {
    const authorUserId = req.user?.sub;

    if (!authorUserId) {
      return null;
    }

    return this.usersService.createAssociationReview(authorUserId, id, body);
  }

  @Get('favorites')
  @Roles('user', 'admin')
  getFavorites(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return [];
    }

    return this.usersService.getFavoriteOffers(userId);
  }

  @Post('favorites/:offerId')
  @Roles('user', 'admin')
  addFavorite(@Param('offerId') offerId: string, @Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.addFavoriteOffer(userId, offerId);
  }

  @Delete('favorites/:offerId')
  @Roles('user', 'admin')
  removeFavorite(@Param('offerId') offerId: string, @Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.removeFavoriteOffer(userId, offerId);
  }

  @Get('applications')
  @Roles('user', 'admin')
  getApplications(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return [];
    }

    return this.usersService.getVolunteerApplications(userId);
  }

  @Post('applications/:applicationId/validate')
  @Roles('association')
  validateApplication(
    @Param('applicationId') applicationId: string,
    @Req() req: { user?: { sub?: string } },
    @Body() body: { note?: string },
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.validateVolunteerApplication(userId, applicationId, body?.note);
  }

  @Post('applications/:offerId')
  @Roles('user', 'admin')
  addApplication(
    @Param('offerId') offerId: string,
    @Req() req: { user?: { sub?: string } },
    @Body() body: CreateVolunteerApplicationDto,
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.addVolunteerApplication(userId, offerId, body.message);
  }

  @Get('history')
  @Roles('user', 'admin')
  getHistory(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return [];
    }

    return this.usersService.getVolunteerHistory(userId);
  }

  @Get('bookings')
  @Roles('user', 'admin')
  getBookings(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      return [];
    }

    return this.usersService.getVolunteerBookings(userId);
  }

  @Post('bookings')
  @Roles('user', 'admin')
  addBooking(
    @Req() req: { user?: { sub?: string } },
    @Body() body: CreateVolunteerBookingDto,
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.addVolunteerBooking(userId, body);
  }

  @Delete('bookings/:bookingId')
  @Roles('user', 'admin')
  removeBooking(
    @Param('bookingId') bookingId: string,
    @Req() req: { user?: { sub?: string } },
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.removeVolunteerBooking(userId, bookingId);
  }

  @Post('history/:offerId')
  @Roles('admin')
  addHistoryEntry(
    @Param('offerId') offerId: string,
    @Req() req: { user?: { sub?: string } },
    @Body() body: { note?: string },
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      return null;
    }

    return this.usersService.addVolunteerHistoryEntry(userId, offerId, body?.note);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user?: { sub?: string; role?: string } }) {
    const requester = req.user;

    if (requester?.role !== 'admin' && requester?.sub !== id) {
      throw new ForbiddenException('You can only access your own profile.');
    }

    return this.usersService.findById(id);
  }
}
