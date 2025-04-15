import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Game } from '@prisma/client';
import { RawgService } from '../src/games/rawg.service';

describe('GamesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rawgService: RawgService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(RawgService)
    .useValue({
      searchGame: jest.fn(),
      searchGames: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    rawgService = app.get<RawgService>(RawgService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.game.deleteMany();
    jest.clearAllMocks();
  });

  describe('/games (GET)', () => {
    it('should return empty list when no games exist', () => {
      return request(app.getHttpServer())
        .get('/games')
        .expect(200)
        .expect({
          count: 0,
          results: [],
          next: null,
          previous: null
        });
    });

    it('should return paginated games', async () => {
      const games: Game[] = await Promise.all([
        prisma.game.create({
          data: {
            slug: 'game-1',
            name: 'Game 1',
            description: 'Description 1',
            platforms: ['PC'],
            released: new Date('2024-01-01'),
            rating: 90,
            rating_top: 100,
            metacritic: 90,
            background_image: 'game1.jpg',
            stores: ['Steam']
          }
        }),
        prisma.game.create({
          data: {
            slug: 'game-2',
            name: 'Game 2',
            description: 'Description 2',
            platforms: ['PS5'],
            released: new Date('2024-01-02'),
            rating: 85,
            rating_top: 100,
            metacritic: 85,
            background_image: 'game2.jpg',
            stores: ['PlayStation Store']
          }
        })
      ]);

      const response = await request(app.getHttpServer())
        .get('/games?page=1&limit=10')
        .expect(200);

      expect(response.body).toMatchObject({
        count: 2,
        results: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: games[0].name,
            platforms: games[0].platforms
          }),
          expect.objectContaining({
            id: expect.any(String),
            name: games[1].name,
            platforms: games[1].platforms
          })
        ]),
        next: null,
        previous: null
      });
    });

    it('should filter games by platform', async () => {
      await Promise.all([
        prisma.game.create({
          data: {
            slug: 'pc-game',
            name: 'PC Game',
            description: 'PC Description',
            platforms: ['PC'],
            released: new Date('2024-01-01'),
            rating: 90,
            rating_top: 100,
            metacritic: 90,
            background_image: 'pc.jpg',
            stores: ['Steam']
          }
        }),
        prisma.game.create({
          data: {
            slug: 'ps5-game',
            name: 'PS5 Game',
            description: 'PS5 Description',
            platforms: ['PS5'],
            released: new Date('2024-01-02'),
            rating: 85,
            rating_top: 100,
            metacritic: 85,
            background_image: 'ps5.jpg',
            stores: ['PlayStation Store']
          }
        })
      ]);

      const response = await request(app.getHttpServer())
        .get('/games?platform=PC')
        .expect(200);

      expect(response.body).toMatchObject({
        count: 1,
        results: [
          expect.objectContaining({
            name: 'PC Game',
            platforms: ['PC']
          })
        ],
        next: null,
        previous: null
      });
    });
  });

  describe('/games/search (GET)', () => {
    it('should return game when searching by title', async () => {
      // Mock RAWG API response
      const mockRawgGame = {
        id: 123,
        slug: 'test-game',
        name: 'Test Game',
        description_raw: 'Test Description',
        released: '2024-01-01',
        background_image: 'test.jpg',
        rating: 90,
        rating_top: 100,
        metacritic: 90,
        playtime: 10,
        platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }],
        stores: [{ store: { id: 1, name: 'Steam', slug: 'steam' } }]
      };

      jest.spyOn(rawgService, 'searchGame').mockResolvedValueOnce(mockRawgGame);

      const response = await request(app.getHttpServer())
        .get('/games/search?title=Test Game')
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: mockRawgGame.name,
        description: mockRawgGame.description_raw,
        platforms: ['PC']
      });
    });

    it('should return 404 when game is not found', async () => {
      // Mock the RAWG service to return null
      jest.spyOn(rawgService, 'searchGame').mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .get('/games/search?title=NonExistentGame')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Game not found',
          error: 'Not Found'
        });
    });

    it('should handle RAWG API errors gracefully', async () => {
      // Mock the RAWG service
      jest.spyOn(rawgService, 'searchGame').mockRejectedValueOnce(new Error('RAWG API Error'));

      return request(app.getHttpServer())
        .get('/games/search?title=SomeGame')
        .expect(500)
        .expect({
          statusCode: 500,
          message: 'Error fetching game data',
          error: 'Internal Server Error'
        });
    });
  });
});