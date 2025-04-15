import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PrismaService } from '../prisma/prisma.service';
import { RawgService } from './rawg.service';

@Module({
  controllers: [GamesController],
  providers: [GamesService, PrismaService, RawgService],
})
export class GamesModule {}
