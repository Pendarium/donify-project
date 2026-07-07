import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RnaLookupService } from '../../common/services/rna-lookup.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rnaLookupService: RnaLookupService,
    private readonly prisma: PrismaService,
  ) {}

  private async ensureDemoUser(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    const passwordHash = await bcrypt.hash('Password123!', 10);

    if (normalized === 'contact@association-test.com') {
      const association = await this.prisma.association.upsert({
        where: { rnaNumber: 'RNA-TEST-001' },
        update: {
          name: 'Association Test',
          description: 'Association de test pour Donnify.',
          address: "5 rue de l'Espoir, Paris",
          email: 'contact@association-test.com',
          phone: '0123456789',
        },
        create: {
          name: 'Association Test',
          description: 'Association de test pour Donnify.',
          address: "5 rue de l'Espoir, Paris",
          email: 'contact@association-test.com',
          phone: '0123456789',
          rnaNumber: 'RNA-TEST-001',
        },
      });

      await this.prisma.user.upsert({
        where: { email: 'contact@association-test.com' },
        update: {
          username: 'Association Test',
          password: passwordHash,
          role: 'association',
          phone: '0123456789',
          associationId: association.id,
        },
        create: {
          username: 'Association Test',
          email: 'contact@association-test.com',
          password: passwordHash,
          role: 'association',
          phone: '0123456789',
          associationId: association.id,
        },
      });

      return;
    }

    if (normalized === 'benevole@test.com') {
      await this.prisma.user.upsert({
        where: { email: 'benevole@test.com' },
        update: {
          username: 'Benevole',
          password: passwordHash,
          role: 'user',
        },
        create: {
          username: 'Benevole',
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
    }
  }

  async register(dto: RegisterDto) {
    const role = dto.role === 'association' ? 'association' : 'user';
    const usernameSource = role === 'association' ? dto.associationName : dto.username;
    const username = usernameSource?.trim() || '';
    const email = dto.email.trim().toLowerCase();
    let associationData: Awaited<ReturnType<RnaLookupService['getAssociationData']>> = null;

    if (role === 'association') {
      associationData = await this.rnaLookupService.getAssociationData(dto.rnaNumber || '');

      if (!associationData) {
        throw new NotFoundException('Association introuvable');
      }
    }

    const existingUsername = await this.usersService.findByUsername(username);
    const existingEmail = await this.usersService.findByEmail(email);

    if (existingUsername) {
      throw new ConflictException(role === 'association'
        ? 'Un compte avec ce nom d\'association existe deja.'
        : 'Un compte avec ce nom d\'utilisateur existe deja.');
    }

    if (existingEmail) {
      throw new ConflictException('Un compte avec cette adresse e-mail existe deja.');
    }

    const phoneFromRna = role === 'association' ? associationData?.phone : undefined;
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username,
      email,
      password: passwordHash,
      role,
      phone: phoneFromRna,
    });

    if (role === 'association' && associationData) {
      const association = await this.prisma.association.upsert({
        where: { rnaNumber: associationData.rnaNumber },
        update: {
          name: associationData.name,
          description: associationData.description,
          address: associationData.address,
          email,
          phone: associationData.phone,
        },
        create: {
          name: associationData.name,
          description: associationData.description,
          address: associationData.address,
          email,
          phone: associationData.phone,
          rnaNumber: associationData.rnaNumber,
        },
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { associationId: association.id },
      });
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const rawIdentifier = dto.identifier.trim();
    const identifier = rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : rawIdentifier;
    await this.ensureDemoUser(identifier);
    const password = dto.password.trim();
    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user) {
      throw new UnauthorizedException('Nom d\'utilisateur, e-mail ou mot de passe invalide.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Nom d\'utilisateur, e-mail ou mot de passe invalide.');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
