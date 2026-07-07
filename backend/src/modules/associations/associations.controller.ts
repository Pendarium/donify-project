import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AssociationsService } from './associations.service';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';

@Controller('associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto & { certified?: string }) {
    return this.associationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.associationsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('association', 'admin')
  create(@Body() dto: CreateAssociationDto) {
    return this.associationsService.create(dto);
  }

  @Patch(':id/certify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  certify(@Param('id') id: string) {
    return this.associationsService.certify(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('association', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateAssociationDto) {
    return this.associationsService.update(id, dto as Record<string, unknown>);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('association', 'admin')
  remove(@Param('id') id: string) {
    return this.associationsService.remove(id);
  }
}
