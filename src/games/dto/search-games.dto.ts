import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchGamesDto {
  @ApiProperty({
    description: 'Title of the game to search',
    example: 'The Witcher 3',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}
