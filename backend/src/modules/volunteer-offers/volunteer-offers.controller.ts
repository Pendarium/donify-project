import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateVolunteerOfferDto } from './dto/create-volunteer-offer.dto';
import { UpdateVolunteerOfferDto } from './dto/update-volunteer-offer.dto';
import { VolunteerOffersService } from './volunteer-offers.service';

@Controller('volunteer-offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VolunteerOffersController {
  constructor(private readonly volunteerOffersService: VolunteerOffersService) {}

  @Get()
  findAll(
    @Query()
    query: PaginationQueryDto & {
      associationId?: string;
      city?: string;
      startFrom?: string;
      endTo?: string;
    },
  ) {
    return this.volunteerOffersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.volunteerOffersService.findOne(id);
  }

  @Post()
  @Roles('association', 'admin')
  create(@Body() dto: CreateVolunteerOfferDto) {
    return this.volunteerOffersService.create(dto);
  }

  @Patch(':id')
  @Roles('association', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateVolunteerOfferDto) {
    return this.volunteerOffersService.update(id, dto as Record<string, unknown>);
  }

  @Delete(':id')
  @Roles('association', 'admin')
  remove(
    @Param('id') id: string,
    @Req() req: { user?: { sub?: string; role?: string } },
  ) {
    const userId = req.user?.sub;
    const role = req.user?.role;

    if (!userId) {
      throw new ForbiddenException('User not authenticated.');
    }

    if (role === 'admin') {
      return this.volunteerOffersService.remove(id);
    }

    if (role === 'association') {
      return this.volunteerOffersService.removeForAssociation(id, userId);
    }

    return this.volunteerOffersService.remove(id);
  }
}
