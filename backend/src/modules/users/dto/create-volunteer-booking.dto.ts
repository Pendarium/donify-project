import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVolunteerBookingDto {
  @IsDateString()
  date!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
