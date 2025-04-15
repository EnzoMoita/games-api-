import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Game, User } from '@prisma/client';
import { RawgService } from '../src/games/rawg.service';
import { AuthService } from '../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rawgService: RawgService;
  let authService: AuthService;
  let jwtToken: string;
  let testUser: User;

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
    authService = app.get<AuthService>(AuthService);
    await app.init();

    // Create a test user and get JWT token
    const hashedPassword = await bcrypt.hash('test123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User'
      }
    });

    const loginResponse = await authService.login({
      email: 'test@example.com',
      password: 'test123'
    });
    jwtToken = loginResponse.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.game.deleteMany();
    jest.clearAllMocks();
  });

  describe('Auth', () => {
    describe('/auth/register (POST)', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'newuser@example.com',
            password: 'password123',
            name: 'New User'
          })
          .expect(201)
          .expect(res => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
            expect(res.body.user).not.toHaveProperty('password');
          });
      });

      it('should not register a user with existing email', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          })
          .expect(409)
          .expect({
            statusCode: 409,
            message: 'Email already registered',
            error: 'Conflict'
          });
      });
    });

    describe('/auth/login (POST)', () => {
      it('should login successfully with correct credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'test123'
          })
          .expect(200)
          .expect(res => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
            expect(res.body.user).not.toHaveProperty('password');
          });
      });

      it('should fail with incorrect credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
          .expect(401)
          .expect({
            statusCode: 401,
            message: 'Invalid credentials',
            error: 'Unauthorized'
          });
      });
    });
  });

  describe('Games', () => {
    describe('/games (GET)', () => {
      it('should require authentication', () => {
        return request(app.getHttpServer())
          .get('/games')
          .expect(401);
      });

      it('should return empty list when no games exist', () => {
        return request(app.getHttpServer())
          .get('/games')
          .set('Authorization', `Bearer ${jwtToken}`)
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
          .set('Authorization', `Bearer ${jwtToken}`)
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
          .set('Authorization', `Bearer ${jwtToken}`)
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
      it('should require authentication', () => {
        return request(app.getHttpServer())
          .get('/games/search?title=Test Game')
          .expect(401);
      });

      it('should return game when searching by title', async () => {
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
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          name: mockRawgGame.name,
          description: mockRawgGame.description_raw,
          platforms: ['PC']
        });
      });

      it('should return 404 when game is not found', async () => {
        jest.spyOn(rawgService, 'searchGame').mockResolvedValueOnce(null);

        return request(app.getHttpServer())
          .get('/games/search?title=NonExistentGame')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(404)
          .expect({
            statusCode: 404,
            message: 'Game not found',
            error: 'Not Found'
          });
      });

      it('should handle RAWG API errors gracefully', async () => {
        jest.spyOn(rawgService, 'searchGame').mockRejectedValueOnce(new Error('RAWG API Error'));

        return request(app.getHttpServer())
          .get('/games/search?title=SomeGame')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(500)
          .expect({
            statusCode: 500,
            message: 'Error fetching game data',
            error: 'Internal Server Error'
          });
      });
    });
  });
});
