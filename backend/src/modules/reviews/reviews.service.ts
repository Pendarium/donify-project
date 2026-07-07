import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query?: { page?: number; limit?: number; search?: string }) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 0);
    const search = query?.search?.trim().toLowerCase();

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (limit > 0) {
      return this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { user: true, association: true },
        skip: (page - 1) * limit,
        take: limit,
      }).then((data) => ({
        data,
        total: data.length,
        page,
        limit,
      }));
    }

    return this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: true, association: true },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { user: true, association: true },
    });

    if (!review) {
      throw new NotFoundException(`Avis introuvable pour l'identifiant ${id}`);
    }

    return review;
  }

  async create(data: { rating: number; comment?: string; userId: string; associationId: string; }) {
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: data.userId,
        associationId: data.associationId,
      },
      select: { id: true },
    });

    if (existingReview) {
      throw new ConflictException('Vous avez deja evalue cette association.');
    }

    return this.prisma.review.create({
      data,
      include: { user: true, association: true },
    });
  }

  private ensureOwnership(review: { userId: string }, user?: { sub?: string; role?: string }) {
    if (user?.role === 'admin') {
      return;
    }

    if (user?.sub !== review.userId) {
      throw new ForbiddenException('Vous pouvez uniquement modifier ou supprimer votre propre avis.');
    }
  }

  async update(id: string, data: Record<string, unknown>, user?: { sub?: string; role?: string }) {
    const review = await this.findOne(id);
    this.ensureOwnership(review, user);

    const updateData: { rating?: number; comment?: string } = {};

    if (typeof data.rating === 'number') {
      updateData.rating = data.rating;
    }

    if (typeof data.comment === 'string') {
      updateData.comment = data.comment;
    }

    return this.prisma.review.update({
      where: { id },
      data: updateData,
      include: { user: true, association: true },
    });
  }

  async remove(id: string, user?: { sub?: string; role?: string }) {
    const review = await this.findOne(id);
    this.ensureOwnership(review, user);

    return this.prisma.review.delete({ where: { id } });
  }
}
