import { Injectable, Inject } from '@nestjs/common';
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
    // Try to get from cache first
    const cachedGame = await this.cacheManager.get(`game:${title}`);
    if (cachedGame) {
      return cachedGame;
    }

    // Check database
    const gameInDb = await this.prisma.game.findFirst({
      where: {
        title: {
          contains: title,
          mode: 'insensitive',
        },
      },
    });

    if (gameInDb) {
      await this.cacheManager.set(`game:${title}`, gameInDb, 3600);
      return gameInDb;
    }

    // Fetch from RAWG API
    const gameData = await this.rawgService.searchGame(title);
    if (!gameData) {
      return null;
    }

    // Save to database
    const savedGame = await this.prisma.game.create({
      data: {
        title: gameData.title,
        description: gameData.description,
        platforms: gameData.platforms,
        releaseDate: new Date(gameData.releaseDate),
        rating: gameData.rating,
        coverImage: gameData.coverImage,
      },
    });

    // Save to cache
    await this.cacheManager.set(`game:${title}`, savedGame, 3600);

    return savedGame;
  }

  async listGames(query: ListGamesDto) {
    const { title, platform, page = 1, limit = 10 } = query;
    
    // Ensure page and limit are numbers
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.GameWhereInput = {};

    if (title) {
      where.title = {
        contains: title,
        mode: 'insensitive',
      };
    }

    if (platform) {
      where.platforms = {
        has: platform,
      };
    }

    try {
      const [games, total] = await Promise.all([
        this.prisma.game.findMany({
          where,
          skip,
          take,
        }),
        this.prisma.game.count({ where }),
      ]);

      return {
        data: games,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      console.error('Error in listGames:', error);
      throw error;
    }
  }
}
