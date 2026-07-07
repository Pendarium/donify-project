import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVolunteerApplicationDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(240)
  message?: string;
}