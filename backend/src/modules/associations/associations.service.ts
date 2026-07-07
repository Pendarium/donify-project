import { Injectable, NotFoundException } from '@nestjs/common';
import { RnaLookupService } from '../../common/services/rna-lookup.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssociationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rnaLookupService: RnaLookupService,
  ) {}

  findAll(query?: { search?: string; certified?: string; page?: number; limit?: number }) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 0);
    const search = query?.search?.trim().toLowerCase();
    const certified = query?.certified !== undefined ? query.certified === 'true' || query.certified === '1' : undefined;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (certified !== undefined) {
      where.isCertified = certified;
    }

    if (limit > 0) {
      return this.prisma.association.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { offers: true },
        skip: (page - 1) * limit,
        take: limit,
      }).then((data) => ({
        data,
        total: data.length,
        page,
        limit,
      }));
    }

    return this.prisma.association.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { offers: true },
    });
  }

  async findOne(id: string) {
    const association = await this.prisma.association.findUnique({
      where: { id },
      include: { offers: true },
    });

    if (!association) {
      throw new NotFoundException(`Association introuvable pour l'identifiant ${id}`);
    }

    return association;
  }

  async create(data: { name: string; description?: string; address: string; email?: string; phone?: string; rnaNumber: string; isCertified?: boolean; }) {
    const existsInRna = await this.rnaLookupService.associationExists(data.rnaNumber);

    if (!existsInRna) {
      throw new NotFoundException('Association introuvable');
    }

    return this.prisma.association.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.findOne(id);

    return this.prisma.association.update({
      where: { id },
      data,
    });
  }

  async certify(id: string) {
    await this.findOne(id);

    return this.prisma.association.update({
      where: { id },
      data: { isCertified: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.association.delete({ where: { id } });
  }
}
