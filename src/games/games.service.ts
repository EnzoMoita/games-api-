import { Injectable, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { RawgService } from './rawg.service';
import { ListGamesDto } from './dto/list-games.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private rawgService: RawgService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async searchGames(title: string) {
    // Try cache first
    const cacheKey = `game:${title.toLowerCase()}`;
    const cachedGame = await this.cacheManager.get(cacheKey);
    if (cachedGame) {
      return cachedGame;
    }

    try {
      const gameData = await this.rawgService.searchGame(title);
      
      if (!gameData) {
        throw new NotFoundException('Game not found');
      }

      // Check if game already exists in database
      let game = await this.prisma.game.findFirst({
        where: {
          slug: gameData.slug,
        },
      });

      // If not in database, save it
      if (!game) {
        game = await this.prisma.game.create({
          data: {
            slug: gameData.slug,
            name: gameData.name,
            description: gameData.description_raw,
            released: gameData.released ? new Date(gameData.released) : null,
            background_image: gameData.background_image,
            rating: gameData.rating,
            rating_top: gameData.rating_top,
            metacritic: gameData.metacritic,
            playtime: gameData.playtime,
            platforms: gameData.platforms?.map(p => p.platform.name) || [],
            stores: gameData.stores?.map(s => s.store.name) || [],
          },
        });
      }

      // Save to cache
      await this.cacheManager.set(cacheKey, game, 3600);

      return game;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching game data');
    }
  }

  async listGames(query: ListGamesDto) {
    const { title, platform, page = 1, limit = 10 } = query;


    if (title) {
      try {
        const gameData = await this.rawgService.searchGames(title);
        
        const games = await Promise.all(
          gameData.results.map(async (game) => {
            let existingGame = await this.prisma.game.findFirst({
              where: { slug: game.slug },
            });

            if (!existingGame) {
              existingGame = await this.prisma.game.create({
                data: {
                  slug: game.slug,
                  name: game.name,
                  description: game.description_raw || '',
                  released: game.released ? new Date(game.released) : null,
                  background_image: game.background_image,
                  rating: game.rating,
                  rating_top: game.rating_top,
                  metacritic: game.metacritic,
                  playtime: game.playtime,
                  platforms: game.platforms?.map(p => p.platform.name) || [],
                  stores: game.stores?.map(s => s.store.name) || [],
                },
              });
            }

            return existingGame;
          })
        );

        return {
          count: gameData.count,
          results: games,
          next: gameData.next,
          previous: gameData.previous,
        };
      } catch (error) {
        throw new InternalServerErrorException('Error fetching game data');
      }
    }

    // If no title, return from database with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.GameWhereInput = {};

    if (platform) {
      where.platforms = {
        has: platform,
      };
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        skip,
        take,
        orderBy: {
          rating: 'desc',
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      count: total,
      results: games,
      next: total > skip + take ? `/games?page=${page + 1}&limit=${limit}` : null,
      previous: page > 1 ? `/games?page=${page - 1}&limit=${limit}` : null,
    };
  }
}