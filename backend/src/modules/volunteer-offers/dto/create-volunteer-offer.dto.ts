import { IsBoolean, IsDateString, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateVolunteerOfferDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsString()
  @MinLength(3)
  location!: string;

  @IsInt()
  @Min(1)
  durationHours!: number;

  @IsInt()
  @Min(1)
  volunteersNeeded!: number;

  @IsBoolean()
  isUrgent!: boolean;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  associationId!: string;
}
