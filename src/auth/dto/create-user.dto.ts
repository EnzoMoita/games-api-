import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Enzo Salomão', required: false })
  @IsString()
  @IsOptional()
  name?: string;
}