import { IsEmail, IsIn, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @ValidateIf((obj: RegisterDto) => obj.role !== 'association')
  @IsString()
  @MinLength(3)
  username?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn(['user', 'association'])
  role?: 'user' | 'association';

  @ValidateIf((obj: RegisterDto) => obj.role === 'association')
  @IsString()
  @MinLength(2)
  associationName?: string;

  @ValidateIf((obj: RegisterDto) => obj.role === 'association')
  @IsString()
  @MinLength(3)
  rnaNumber?: string;
}
