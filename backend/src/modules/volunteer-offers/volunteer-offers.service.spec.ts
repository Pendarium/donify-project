import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { VolunteerOffersService } from './volunteer-offers.service';

describe('VolunteerOffersService', () => {
  let service: VolunteerOffersService;

  const prisma = {
    volunteerOffer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolunteerOffersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VolunteerOffersService>(VolunteerOffersService);
    jest.clearAllMocks();
  });

  it('should return offers list', async () => {
    prisma.volunteerOffer.findMany.mockResolvedValue([{ id: '1', title: 'Cleanup' }]);

    await expect(service.findAll()).resolves.toEqual([{ id: '1', title: 'Cleanup' }]);
  });
});
