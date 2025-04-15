import { Controller, Get, Query, UseInterceptors, HttpStatus, UseGuards } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { SearchGamesDto } from './dto/search-games.dto';
import { ListGamesDto } from './dto/list-games.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('games')
@Controller('games')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('search')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Buscar jogos por título',
    description: 'Busca um jogo específico usando seu título. Os resultados são armazenados em cache para melhor performance.'
  })
  @ApiQuery({
    name: 'title',
    required: true,
    description: 'O título do jogo a ser pesquisado',
    type: String,
    example: 'The Last of Us'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jogo encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Identificador único do jogo' },
        slug: { type: 'string', description: 'Versão do nome do jogo amigável para URL' },
        name: { type: 'string', description: 'Nome completo do jogo' },
        description: { type: 'string', description: 'Descrição detalhada do jogo' },
        released: { type: 'string', format: 'date', description: 'Data de lançamento do jogo' },
        background_image: { type: 'string', format: 'uri', description: 'URL da imagem de capa do jogo' },
        rating: { type: 'number', description: 'Avaliação média do jogo' },
        rating_top: { type: 'integer', description: 'Avaliação máxima possível' },
        metacritic: { type: 'integer', description: 'Pontuação no Metacritic' },
        playtime: { type: 'integer', description: 'Tempo médio de jogo em horas' },
        platforms: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Lista de plataformas onde o jogo está disponível'
        },
        stores: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de lojas onde o jogo pode ser comprado'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Jogo não encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Jogo não encontrado' },
        error: { type: 'string', example: 'Não Encontrado' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Erro interno ao buscar dados do jogo',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Erro ao buscar dados do jogo' },
        error: { type: 'string', example: 'Erro Interno do Servidor' }
      }
    }
  })
  async searchGames(@Query() query: SearchGamesDto, @CurrentUser() user) {
    console.log('User performing search:', user.email);
    return this.gamesService.searchGames(query.title);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os jogos com filtros',
    description: 'Retorna uma lista paginada de jogos com filtros opcionais por título e plataforma'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de jogos recuperada com sucesso',
    schema: {
      type: 'object',
      properties: {
        count: { 
          type: 'number', 
          description: 'Número total de jogos que correspondem aos critérios'
        },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', description: 'Identificador único do jogo' },
              slug: { type: 'string', description: 'Versão do nome do jogo amigável para URL' },
              name: { type: 'string', description: 'Nome completo do jogo' },
              description: { type: 'string', description: 'Descrição detalhada do jogo' },
              released: { type: 'string', format: 'date', description: 'Data de lançamento do jogo' },
              background_image: { type: 'string', format: 'uri', description: 'URL da imagem de capa do jogo' },
              rating: { type: 'number', description: 'Avaliação média do jogo' },
              rating_top: { type: 'integer', description: 'Avaliação máxima possível' },
              metacritic: { type: 'integer', description: 'Pontuação no Metacritic' },
              playtime: { type: 'integer', description: 'Tempo médio de jogo em horas' },
              platforms: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Lista de plataformas onde o jogo está disponível'
              },
              stores: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista de lojas onde o jogo pode ser comprado'
              }
            }
          }
        },
        next: { 
          type: 'string', 
          nullable: true,
          description: 'URL para a próxima página de resultados'
        },
        previous: { 
          type: 'string', 
          nullable: true,
          description: 'URL para a página anterior de resultados'
        }
      }
    }
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filtrar jogos por título',
    type: String
  })
  @ApiQuery({
    name: 'platform',
    required: false,
    description: 'Filtrar jogos por plataforma (ex: PC, PS5, Xbox Series X)',
    type: String
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página para paginação',
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de itens por página',
    type: Number,
    example: 10
  })
  async listGames(@Query() query: ListGamesDto, @CurrentUser() user) {
    console.log('User listing games:', user.email);
    return this.gamesService.listGames(query);
  }
}