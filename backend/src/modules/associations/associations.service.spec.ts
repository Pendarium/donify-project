import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AssociationsService } from './associations.service';

describe('AssociationsService', () => {
  let service: AssociationsService;

  const prisma = {
    association: {
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
        AssociationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AssociationsService>(AssociationsService);
    jest.clearAllMocks();
  });

  it('should return associations list', async () => {
    prisma.association.findMany.mockResolvedValue([{ id: '1', name: 'HelpNow' }]);

    await expect(service.findAll()).resolves.toEqual([{ id: '1', name: 'HelpNow' }]);
  });
});
