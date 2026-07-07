import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../public/src/app.module';
import { TransformInterceptor } from '../public/src/common/interceptors/transform.interceptor';
import { PrismaService } from '../public/src/prisma/prisma.service';

describe('Critical Flows (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const runId = Date.now().toString();
  const userEmail = `user_${runId}@e2e.test`;
  const adminEmail = `admin_${runId}@e2e.test`;
  const associationEmail = `association_${runId}@e2e.test`;
  const commonPassword = 'Password123!';

  const created = {
    userToken: '',
    adminToken: '',
    associationToken: '',
    associationId: '',
  };

  const cleanup = async () => {
    await prisma.review.deleteMany({
      where: {
        OR: [
          { user: { email: userEmail } },
          { user: { email: adminEmail } },
          { user: { email: associationEmail } },
          { association: { rnaNumber: `RNA-E2E-${runId}` } },
        ],
      },
    });

    await prisma.volunteerOffer.deleteMany({
      where: {
        association: {
          rnaNumber: `RNA-E2E-${runId}`,
        },
      },
    });

    await prisma.association.deleteMany({
      where: {
        rnaNumber: `RNA-E2E-${runId}`,
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [userEmail, adminEmail, associationEmail],
        },
      },
    });
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'super-secure-e2e-secret';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/donnify_db';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        stopAtFirstError: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());

    prisma = app.get(PrismaService);

    await cleanup();
    await app.init();
  });

  it('GET /api/health should return API health', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('ok');
      });
  });

  it('should register, login, protect routes, create offer and block duplicate reviews', async () => {
    const registerUser = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: 'E2E User',
        email: userEmail,
        password: commonPassword,
      })
      .expect(201);

    created.userToken = registerUser.body.data.accessToken as string;

    const registerAdmin = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: 'E2E Admin',
        email: adminEmail,
        password: commonPassword,
      })
      .expect(201);

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'admin' },
    });

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: commonPassword })
      .expect(201);

    created.adminToken = loginAdmin.body.data.accessToken as string;

    const registerAssociationUser = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: 'E2E Association',
        email: associationEmail,
        password: commonPassword,
      })
      .expect(201);

    await prisma.user.update({
      where: { email: associationEmail },
      data: { role: 'association' },
    });

    const loginAssociationUser = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: associationEmail, password: commonPassword })
      .expect(201);

    created.associationToken = loginAssociationUser.body.data.accessToken as string;

    await request(app.getHttpServer()).get('/api/users').expect(401);

    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${created.userToken}`)
      .expect(403);

    const createAssociation = await request(app.getHttpServer())
      .post('/api/associations')
      .set('Authorization', `Bearer ${created.adminToken}`)
      .send({
        name: 'E2E Association Org',
        description: 'Association used in end-to-end tests',
        address: '10 rue de la Solidarite, Paris',
        email: 'org_e2e@assoc.test',
        phone: '0102030405',
        rnaNumber: `RNA-E2E-${runId}`,
      })
      .expect(201);

    created.associationId = createAssociation.body.data.id as string;

    await request(app.getHttpServer())
      .post('/api/volunteer-offers')
      .set('Authorization', `Bearer ${created.userToken}`)
      .send({
        title: 'Forbidden Offer',
        description: 'Regular user should not create this offer',
        location: 'Paris',
        startDate: '2026-08-10T09:00:00.000Z',
        endDate: '2026-08-10T17:00:00.000Z',
        associationId: created.associationId,
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/volunteer-offers')
      .set('Authorization', `Bearer ${created.associationToken}`)
      .send({
        title: 'Distribution alimentaire',
        description: 'Aide a la distribution de colis alimentaires pendant la journee.',
        location: 'Paris',
        startDate: '2026-08-10T09:00:00.000Z',
        endDate: '2026-08-10T17:00:00.000Z',
        associationId: created.associationId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${created.userToken}`)
      .send({
        rating: 5,
        comment: 'Excellente experience de benevolat.',
        associationId: created.associationId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${created.userToken}`)
      .send({
        rating: 4,
        comment: 'Deuxieme tentative non autorisee.',
        associationId: created.associationId,
      })
      .expect(409);
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });
});
