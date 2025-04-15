import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { SearchGamesDto } from './dto/search-games.dto';
import { ListGamesDto } from './dto/list-games.dto';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('search')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Search for games by title' })
  @ApiQuery({ name: 'title', required: true })
  async searchGames(@Query() query: SearchGamesDto) {
    return this.gamesService.searchGames(query.title);
  }

  @Get()
  @ApiOperation({ summary: 'List all games with filters' })
  async listGames(@Query() query: ListGamesDto) {
    return this.gamesService.listGames(query);
  }
}
