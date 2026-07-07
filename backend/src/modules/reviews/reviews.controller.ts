import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Req() req: { user?: { sub?: string } }, @Body() dto: CreateReviewDto) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Utilisateur authentifie manquant');
    }

    return this.reviewsService.create({
      ...dto,
      userId: req.user.sub,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto, @Req() req: { user?: { sub?: string; role?: string } }) {
    return this.reviewsService.update(id, dto as Record<string, unknown>, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user?: { sub?: string; role?: string } }) {
    return this.reviewsService.remove(id, req.user);
  }
}
