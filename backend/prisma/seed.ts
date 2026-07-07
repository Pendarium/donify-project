import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/donnify_db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Créer un bénévole
  const volunteer = await prisma.user.upsert({
    where: { email: 'benevole@test.com' },
    update: {},
    create: {
      username: 'Benevolle',
      firstName: 'Jean',
      lastName: 'Dupont',
      age: 30,
      address: '10 rue de la Paix, Paris',
      phone: '0612345678',
      email: 'benevole@test.com',
      password: passwordHash,
      role: 'user',
    },
  });

  // Créer une association
  const association = await prisma.association.upsert({
    where: { rnaNumber: 'RNA-TEST-001' },
    update: {},
    create: {
      name: 'Association Test',
      description: 'Association de test pour Donnify.',
      address: '5 rue de l\'Espoir, Paris',
      email: 'contact@association-test.com',
      phone: '0123456789',
      rnaNumber: 'RNA-TEST-001',
      isCertified: false,
    },
  });

  // Créer le compte utilisateur pour l'association et le lier
  await prisma.user.upsert({
    where: { email: 'contact@association-test.com' },
    update: {
      username: 'Association Test',
      password: passwordHash,
      role: 'association',
      associationId: association.id,
    },
    create: {
      username: 'Association Test',
      email: 'contact@association-test.com',
      password: passwordHash,
      role: 'association',
      associationId: association.id,
    },
  });



  console.log('Seed data inserted successfully.');
}

main()
  .catch((error: any) => {
    if (error?.code === 'P1000' || error?.code === 'P1001') {
      console.error('Seed failed: PostgreSQL is unavailable or DATABASE_URL is invalid.');
      console.error('Check your .env file and make sure the PostgreSQL server is running.');
    } else {
      console.error('Seed failed:', error);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
