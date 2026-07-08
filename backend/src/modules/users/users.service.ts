import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly rejectedApplicationPrefix = '__REJECTED__:';
  private readonly rejectedHistoryPrefix = '__REJECTED_HISTORY__:';
  private readonly cancelledHistoryPrefix = '__CANCELLED_BY_VOLUNTEER__:';

  private extractRejectedReason(message?: string | null) {
    if (!message || !message.startsWith(this.rejectedApplicationPrefix)) {
      return null;
    }

    return message.slice(this.rejectedApplicationPrefix.length).trim() || null;
  }

  private toRejectedHistoryNote(reason: string) {
    return `${this.rejectedHistoryPrefix}${reason}`;
  }

  private toCancelledHistoryNote(reason: string) {
    return `${this.cancelledHistoryPrefix}${reason}`;
  }

  private readonly profileSelect = {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    age: true,
    address: true,
    city: true,
    postalCode: true,
    phone: true,
    email: true,
    role: true,
    createdAt: true,
    associationReviewsReceived: {
      orderBy: { createdAt: 'desc' as const },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        association: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  };

  private async attachManagedAssociation<T extends {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null>(user: T) {
    if (!user || user.role !== 'association') {
      return user;
    }

    const selectWithApplications = {
      association: {
        include: {
          userReviewsAuthored: {
            orderBy: { createdAt: 'desc' as const },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          offers: {
            orderBy: { createdAt: 'desc' as const },
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              durationHours: true,
              volunteersNeeded: true,
              isUrgent: true,
              startDate: true,
              endDate: true,
              deletedAt: true,
              createdAt: true,
              historyUsers: {
                orderBy: { completedAt: 'desc' as const },
                select: {
                  id: true,
                  completedAt: true,
                  note: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              },
              applications: {
                where: {
                  OR: [
                    { message: null },
                    { message: { not: { startsWith: this.rejectedApplicationPrefix } } },
                  ],
                },
                orderBy: { createdAt: 'desc' as const },
                select: {
                  id: true,
                  message: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const selectWithoutApplications = {
      association: {
        include: {
          userReviewsAuthored: {
            orderBy: { createdAt: 'desc' as const },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          offers: {
            orderBy: { createdAt: 'desc' as const },
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              durationHours: true,
              volunteersNeeded: true,
              isUrgent: true,
              startDate: true,
              endDate: true,
              deletedAt: true,
              createdAt: true,
              historyUsers: {
                orderBy: { completedAt: 'desc' as const },
                select: {
                  id: true,
                  completedAt: true,
                  note: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    let userWithAssoc: { association?: unknown } | null = null;

    try {
      userWithAssoc = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: selectWithApplications,
      }) as { association?: unknown } | null;
    } catch {
      // Fallback for partially migrated databases where VolunteerApplication is unavailable.
      const fallbackUserWithAssoc = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: selectWithoutApplications,
      }) as { association?: unknown } | null;

      const association = fallbackUserWithAssoc?.association as {
        id?: string;
        offers?: Array<{ id: string } & Record<string, unknown>>;
      } | undefined;

      // Best effort: if VolunteerApplication exists, merge pending applications into each offer.
      if (association?.id && Array.isArray(association.offers)) {
        try {
          const pendingApplications = await this.prisma.volunteerApplication.findMany({
            where: {
              offer: { associationId: association.id },
              OR: [
                { message: null },
                { message: { not: { startsWith: this.rejectedApplicationPrefix } } },
              ],
            },
            orderBy: { createdAt: 'desc' as const },
            select: {
              id: true,
              message: true,
              createdAt: true,
              offerId: true,
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          });

          const applicationsByOffer = new Map<string, Array<Record<string, unknown>>>();

          pendingApplications.forEach((application) => {
            const bucket = applicationsByOffer.get(application.offerId) || [];
            bucket.push(application as unknown as Record<string, unknown>);
            applicationsByOffer.set(application.offerId, bucket);
          });

          association.offers = association.offers.map((offer) => ({
            ...offer,
            applications: applicationsByOffer.get(offer.id) || [],
          }));
        } catch {
          // Keep fallback shape without applications when VolunteerApplication is not available.
        }
      }

      userWithAssoc = fallbackUserWithAssoc;
    }

    const managedAssociation = userWithAssoc?.association;

    return {
      ...user,
      managedAssociation,
    };
  }

  private async findManagedAssociationByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        associationId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur authentifie introuvable.');
    }

    if (user.role !== 'association') {
      throw new ForbiddenException('Seuls les comptes association peuvent evaluer des benevoles.');
    }

    if (user.associationId) {
      return { id: user.associationId };
    }

    const association = await this.prisma.association.findFirst({
      where: {
        OR: [
          { email: user.email },
          { name: user.username },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!association) {
      throw new NotFoundException('Aucun profil association n\'est lie a ce compte.');
    }

    return association;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        age: true,
        address: true,
        city: true,
        postalCode: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: {
        username,
      },
    });
  }

  async create(data: {
    username: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email: string;
    password: string;
    role?: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: this.profileSelect,
    });

    return this.attachManagedAssociation(user);
  }

  async findVolunteerProfileForAssociation(associationUserId: string, volunteerUserId: string) {
    const association = await this.findManagedAssociationByUserId(associationUserId);
    const volunteer = await this.prisma.user.findUnique({
      where: { id: volunteerUserId },
      select: this.profileSelect,
    });

    if (!volunteer) {
      throw new NotFoundException('Benevole introuvable.');
    }

    if (volunteer.role !== 'user') {
      throw new ForbiddenException('Seuls les profils benevoles peuvent etre consultes ici.');
    }

    const linkedApplication = await this.prisma.volunteerApplication.findFirst({
      where: {
        userId: volunteerUserId,
        offer: {
          associationId: association.id,
        },
      },
      select: { id: true },
    });

    const linkedHistory = linkedApplication ? null : await this.prisma.volunteerHistoryEntry.findFirst({
      where: {
        userId: volunteerUserId,
        offer: {
          associationId: association.id,
        },
      },
      select: { id: true },
    });

    if (!linkedApplication && !linkedHistory) {
      throw new ForbiddenException('Vous pouvez uniquement consulter le profil des benevoles lies a vos missions.');
    }

    return volunteer;
  }

  async updateProfile(id: string, data: {
    firstName?: string;
    lastName?: string;
    age?: number;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
  }) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: this.profileSelect,
    });

    return this.attachManagedAssociation(user);
  }

  async deleteAccount(userId: string, confirmationWord?: string) {
    const normalizedConfirmation = (confirmationWord || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    if (normalizedConfirmation !== 'supprime') {
      throw new BadRequestException('Veuillez saisir le mot "SUPPRIME" pour confirmer la suppression du compte.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        associationId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    let resolvedAssociationId = user.associationId;

    if (user.role === 'association' && !resolvedAssociationId) {
      const association = await this.prisma.association.findFirst({
        where: {
          OR: [
            { email: user.email },
            { name: user.username },
          ],
        },
        select: { id: true },
      });

      resolvedAssociationId = association?.id || null;
    }

    await this.prisma.$transaction(async (tx) => {
      if (user.role === 'association' && resolvedAssociationId) {
        const offers = await tx.volunteerOffer.findMany({
          where: { associationId: resolvedAssociationId },
          select: { id: true },
        });
        const offerIds = offers.map((offer) => offer.id);

        if (offerIds.length > 0) {
          await tx.favoriteOffer.deleteMany({
            where: {
              offerId: { in: offerIds },
            },
          });

          await tx.volunteerHistoryEntry.deleteMany({
            where: {
              offerId: { in: offerIds },
            },
          });

          await tx.volunteerApplication.deleteMany({
            where: {
              offerId: { in: offerIds },
            },
          });
        }

        await tx.volunteerOffer.deleteMany({
          where: { associationId: resolvedAssociationId },
        });

        await tx.review.deleteMany({
          where: { associationId: resolvedAssociationId },
        });

        await tx.associationUserReview.deleteMany({
          where: { associationId: resolvedAssociationId },
        });

        await tx.user.updateMany({
          where: { associationId: resolvedAssociationId },
          data: { associationId: null },
        });

        await tx.association.delete({
          where: { id: resolvedAssociationId },
        });
      }

      await tx.review.deleteMany({ where: { userId } });
      await tx.associationUserReview.deleteMany({ where: { userId } });
      await tx.favoriteOffer.deleteMany({ where: { userId } });
      await tx.volunteerHistoryEntry.deleteMany({ where: { userId } });
      await tx.volunteerApplication.deleteMany({ where: { userId } });
      await tx.volunteerBooking.deleteMany({ where: { userId } });

      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { success: true };
  }

  async createAssociationReview(
    authorUserId: string,
    targetUserId: string,
    data: { rating: number; comment?: string },
  ) {
    const association = await this.findManagedAssociationByUserId(authorUserId);
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Benevole introuvable.');
    }

    if (targetUser.role !== 'user') {
      throw new ForbiddenException('Les associations peuvent uniquement evaluer des comptes benevoles.');
    }

    const existingReview = await this.prisma.associationUserReview.findFirst({
      where: {
        associationId: association.id,
        userId: targetUserId,
      },
      select: { id: true },
    });

    if (existingReview) {
      throw new ConflictException('Vous avez deja evalue ce benevole.');
    }

    return this.prisma.associationUserReview.create({
      data: {
        associationId: association.id,
        userId: targetUserId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        association: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async getFavoriteOffers(userId: string) {
    return this.prisma.favoriteOffer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        offer: {
          include: {
            association: true,
          },
        },
      },
    });
  }

  async addFavoriteOffer(userId: string, offerId: string) {
    const offer = await this.prisma.volunteerOffer.findUnique({
      where: { id: offerId },
      select: { id: true },
    });

    if (!offer) {
      throw new NotFoundException('Offre de benevolat introuvable.');
    }

    return this.prisma.favoriteOffer.upsert({
      where: {
        userId_offerId: {
          userId,
          offerId,
        },
      },
      update: {},
      create: {
        userId,
        offerId,
      },
      include: {
        offer: {
          include: {
            association: true,
          },
        },
      },
    });
  }

  async removeFavoriteOffer(userId: string, offerId: string) {
    const existing = await this.prisma.favoriteOffer.findUnique({
      where: {
        userId_offerId: {
          userId,
          offerId,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Offre en favori introuvable.');
    }

    return this.prisma.favoriteOffer.delete({
      where: {
        userId_offerId: {
          userId,
          offerId,
        },
      },
    });
  }

  async getVolunteerHistory(userId: string) {
    return this.prisma.volunteerHistoryEntry.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      include: {
        offer: {
          include: {
            association: true,
          },
        },
      },
    });
  }

  async getVolunteerBookings(userId: string) {
    return this.prisma.volunteerBooking.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async addVolunteerBooking(userId: string, data: { date: string; title: string; note?: string }) {
    const date = new Date(data.date);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date de reservation invalide.');
    }

    return this.prisma.volunteerBooking.create({
      data: {
        userId,
        date,
        title: data.title.trim(),
        note: data.note?.trim() || null,
      },
    });
  }

  async removeVolunteerBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.volunteerBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Reservation introuvable.');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('Vous pouvez uniquement supprimer vos propres reservations.');
    }

    return this.prisma.volunteerBooking.delete({
      where: { id: bookingId },
    });
  }

  async addVolunteerHistoryEntry(userId: string, offerId: string, note?: string) {
    const offer = await this.prisma.volunteerOffer.findUnique({
      where: { id: offerId },
      select: { id: true },
    });

    if (!offer) {
      throw new NotFoundException('Offre de benevolat introuvable.');
    }

    return this.prisma.volunteerHistoryEntry.create({
      data: {
        userId,
        offerId,
        note,
        completedAt: new Date(),
      },
      include: {
        offer: {
          include: {
            association: true,
          },
        },
      },
    });
  }

  async cancelVolunteerMission(userId: string, historyEntryId: string, reason?: string) {
    const historyEntry = await this.prisma.volunteerHistoryEntry.findUnique({
      where: { id: historyEntryId },
      select: {
        id: true,
        userId: true,
        note: true,
        offer: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            associationId: true,
            volunteersNeeded: true,
          },
        },
      },
    });

    if (!historyEntry) {
      throw new NotFoundException('Mission introuvable.');
    }

    if (historyEntry.userId !== userId) {
      throw new ForbiddenException('Vous pouvez uniquement annuler vos propres missions.');
    }

    if (historyEntry.note?.startsWith(this.cancelledHistoryPrefix)) {
      throw new BadRequestException('Cette mission a deja ete annulee.');
    }

    const now = new Date();
    const end = historyEntry.offer.endDate;
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    if (now > endOfDay) {
      throw new BadRequestException('Seules les missions acceptees ou en cours peuvent etre annulees.');
    }

    const trimmedReason = reason?.trim() || 'Mission annulee par le benevole.';
    const cancelledNote = this.toCancelledHistoryNote(trimmedReason);

    return this.prisma.$transaction(async (tx) => {
      await tx.volunteerHistoryEntry.update({
        where: { id: historyEntry.id },
        data: {
          note: cancelledNote,
          completedAt: now,
        },
      });

      await tx.volunteerOffer.update({
        where: { id: historyEntry.offer.id },
        data: {
          volunteersNeeded: (historyEntry.offer.volunteersNeeded || 0) + 1,
        },
      });

      return tx.volunteerHistoryEntry.findUnique({
        where: { id: historyEntry.id },
        include: {
          offer: {
            include: {
              association: true,
            },
          },
        },
      });
    });
  }

  async getVolunteerApplications(userId: string) {
    const applications = await this.prisma.volunteerApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        offer: {
          include: {
            association: true,
          },
        },
      },
    });

    return applications.map((application) => {
      const rejectionReason = this.extractRejectedReason(application.message);

      return {
        ...application,
        status: rejectionReason ? 'rejected' : 'pending',
        rejectionReason,
      };
    });
  }

  async rejectVolunteerApplication(associationUserId: string, applicationId: string, reason?: string) {
    const association = await this.findManagedAssociationByUserId(associationUserId);
    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
        offerId: true,
        offer: {
          select: {
            associationId: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable.');
    }

    if (application.offer.associationId !== association.id) {
      throw new ForbiddenException('Vous pouvez uniquement refuser les candidatures de vos propres offres.');
    }

    const trimmedReason = reason?.trim() || 'Votre candidature a ete refusee par l\'association.';
    const rejectedNote = this.toRejectedHistoryNote(trimmedReason);

    return this.prisma.$transaction(async (tx) => {
      await tx.volunteerHistoryEntry.create({
        data: {
          userId: application.userId,
          offerId: application.offerId,
          note: rejectedNote,
          completedAt: new Date(),
        },
      });

      return tx.volunteerApplication.update({
        where: { id: applicationId },
        data: {
          message: `${this.rejectedApplicationPrefix}${trimmedReason}`,
        },
        include: {
          offer: {
            include: {
              association: true,
            },
          },
        },
      });
    });
  }

  async validateVolunteerApplication(associationUserId: string, applicationId: string, note?: string) {
    const association = await this.findManagedAssociationByUserId(associationUserId);
    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
        offerId: true,
        offer: {
          select: {
            associationId: true,
            volunteersNeeded: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable.');
    }

    if (application.offer.associationId !== association.id) {
      throw new ForbiddenException('Vous pouvez uniquement valider les candidatures de vos propres offres.');
    }

    const normalizedValidationNote = note?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      await tx.volunteerOffer.update({
        where: { id: application.offerId },
        data: {
          volunteersNeeded: Math.max(0, (application.offer.volunteersNeeded || 0) - 1),
        },
      });

      const historyEntry = await tx.volunteerHistoryEntry.create({
        data: {
          userId: application.userId,
          offerId: application.offerId,
          note: normalizedValidationNote,
          completedAt: new Date(),
        },
        include: {
          offer: {
            include: {
              association: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      await tx.volunteerApplication.delete({
        where: { id: application.id },
      });

      return historyEntry;
    });
  }

  async addVolunteerApplication(userId: string, offerId: string, message?: string) {
    const offer = await this.prisma.volunteerOffer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        volunteersNeeded: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offre de benevolat introuvable.');
    }

    if ((offer.volunteersNeeded || 0) < 1) {
      throw new BadRequestException('Aucune place benevole n\'est disponible pour cette offre.');
    }

    return this.prisma.volunteerApplication.upsert({
      where: {
        userId_offerId: {
          userId,
          offerId,
        },
      },
      update: {
        message,
      },
      create: {
        userId,
        offerId,
        message,
      },
      include: {
        offer: {
          include: {
            association: true,
          },
        },
      },
    });
  }
}