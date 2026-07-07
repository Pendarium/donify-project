import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VolunteerOffersService {
  constructor(private readonly prisma: PrismaService) {}

  private async deleteOfferAndDependencies(offerId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.favoriteOffer.deleteMany({ where: { offerId } });
      await tx.volunteerApplication.deleteMany({ where: { offerId } });
      await tx.volunteerHistoryEntry.deleteMany({ where: { offerId } });

      return tx.volunteerOffer.delete({ where: { id: offerId } });
    });
  }

  findAll(query?: {
    search?: string;
    associationId?: string;
    city?: string;
    startFrom?: string;
    endTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 0);
    const search = query?.search?.trim().toLowerCase();
    const city = query?.city?.trim();
    const startFrom = query?.startFrom ? new Date(query.startFrom) : undefined;
    const endTo = query?.endTo ? new Date(query.endTo) : undefined;

    if (startFrom && Number.isNaN(startFrom.getTime())) {
      throw new BadRequestException('Invalid startFrom date.');
    }

    if (endTo && Number.isNaN(endTo.getTime())) {
      throw new BadRequestException('Invalid endTo date.');
    }

    if (startFrom && endTo && startFrom > endTo) {
      throw new BadRequestException('startFrom must be before or equal to endTo.');
    }

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query?.associationId) {
      where.associationId = query.associationId;
    }

    if (city) {
      where.location = { contains: city, mode: 'insensitive' };
    }

    if (startFrom || endTo) {
      where.startDate = {
        ...(startFrom ? { gte: startFrom } : {}),
        ...(endTo ? { lte: endTo } : {}),
      };
    }

    if (limit > 0) {
      return this.prisma.volunteerOffer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { association: true },
        skip: (page - 1) * limit,
        take: limit,
      }).then((data) => ({
        data,
        total: data.length,
        page,
        limit,
      }));
    }

    return this.prisma.volunteerOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { association: true },
    });
  }

  async findOne(id: string) {
    const offer = await this.prisma.volunteerOffer.findUnique({
      where: { id },
      include: { association: true },
    });

    if (!offer) {
      throw new NotFoundException(`Volunteer offer with id ${id} not found`);
    }

    return offer;
  }

  async create(data: {
    title: string;
    description: string;
    location: string;
    durationHours: number;
    volunteersNeeded: number;
    isUrgent: boolean;
    startDate: string | Date;
    endDate: string | Date;
    associationId: string;
  }) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate.');
    }

    if (startDay < today) {
      throw new BadRequestException('La date de mission ne peut pas etre anterieure a aujourd\'hui.');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate.');
    }

    const durationHours = Number(data.durationHours);
    const volunteersNeeded = Number(data.volunteersNeeded);

    if (!Number.isInteger(durationHours) || durationHours < 1) {
      throw new BadRequestException('durationHours must be an integer greater than 0.');
    }

    if (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 1) {
      throw new BadRequestException('volunteersNeeded must be an integer greater than 0.');
    }

    return this.prisma.volunteerOffer.create({
      data: {
        ...data,
        durationHours,
        volunteersNeeded,
        isUrgent: Boolean(data.isUrgent),
        startDate,
        endDate,
      },
      include: { association: true },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const existingOffer = await this.findOne(id);

    const nextStartDate =
      data.startDate !== undefined
        ? new Date(data.startDate as string | Date)
        : existingOffer.startDate;

    const nextEndDate =
      data.endDate !== undefined
        ? new Date(data.endDate as string | Date)
        : existingOffer.endDate;

    if (Number.isNaN(nextStartDate.getTime()) || Number.isNaN(nextEndDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate.');
    }

    if (nextEndDate <= nextStartDate) {
      throw new BadRequestException('endDate must be after startDate.');
    }

    if (data.durationHours !== undefined) {
      const durationHours = Number(data.durationHours);

      if (!Number.isInteger(durationHours) || durationHours < 1) {
        throw new BadRequestException('durationHours must be an integer greater than 0.');
      }
    }

    if (data.volunteersNeeded !== undefined) {
      const volunteersNeeded = Number(data.volunteersNeeded);

      if (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 1) {
        throw new BadRequestException('volunteersNeeded must be an integer greater than 0.');
      }
    }

    return this.prisma.volunteerOffer.update({
      where: { id },
      data: {
        ...data,
        ...(data.durationHours !== undefined ? { durationHours: Number(data.durationHours) } : {}),
        ...(data.volunteersNeeded !== undefined ? { volunteersNeeded: Number(data.volunteersNeeded) } : {}),
        ...(data.isUrgent !== undefined ? { isUrgent: Boolean(data.isUrgent) } : {}),
        ...(data.startDate ? { startDate: nextStartDate } : {}),
        ...(data.endDate ? { endDate: nextEndDate } : {}),
      },
      include: { association: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.deleteOfferAndDependencies(id);
  }

  async removeForAssociation(id: string, associationUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: associationUserId },
      select: {
        associationId: true,
      },
    });

    if (!user?.associationId) {
      throw new NotFoundException('No association linked to this account.');
    }

    const offer = await this.prisma.volunteerOffer.findUnique({
      where: { id },
      select: {
        id: true,
        associationId: true,
      },
    });

    if (!offer) {
      throw new NotFoundException(`Volunteer offer with id ${id} not found`);
    }

    if (offer.associationId !== user.associationId) {
      throw new BadRequestException('You can only delete your own offers.');
    }

    return this.deleteOfferAndDependencies(id);
  }
}
