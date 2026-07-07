export class UserResponseDto {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email: string;
  role: string;
  createdAt: Date;
  associationReviewsReceived?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: Date;
    association: {
      id: string;
      name: string;
    };
  }>;
  managedAssociation?: {
    id: string;
    name: string;
    description?: string | null;
    address: string;
    email?: string | null;
    phone?: string | null;
    rnaNumber: string;
    isCertified: boolean;
    createdAt: Date;
    userReviewsAuthored: Array<{
      id: string;
      rating: number;
      comment?: string | null;
      createdAt: Date;
      user: {
        id: string;
        username: string;
      };
    }>;
    offers: Array<{
      id: string;
      title: string;
      description: string;
      location: string;
      durationHours: number;
      volunteersNeeded: number;
      isUrgent: boolean;
      startDate: Date;
      endDate: Date;
      createdAt: Date;
      historyUsers?: Array<{
        id: string;
        completedAt: Date;
        note?: string | null;
        user: {
          id: string;
          username: string;
        };
      }>;
    }>;
  };
}
