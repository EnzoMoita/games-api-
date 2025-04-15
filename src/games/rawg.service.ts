import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

interface RawgGamePlatform {
  platform: {
    name: string;
  };
}

interface RawgGameResponse {
  id: number;
  name: string;
  description_raw: string;
  platforms: RawgGamePlatform[];
  released: string;
  rating: number;
  background_image: string;
}

interface RawgSearchResponse {
  results: {
    id: number;
    name: string;
  }[];
}

@Injectable()
export class RawgService {
  private readonly apiKey = process.env.RAWG_API_KEY;
  private readonly baseUrl = 'https://api.rawg.io/api';
  private readonly logger = new Logger(RawgService.name);

  async searchGame(title: string) {
    try {
      const response = await axios.get<RawgSearchResponse>(`${this.baseUrl}/games`, {
        params: {
          search: title,
          key: this.apiKey,
        },
      });

      if (!response.data.results.length) {
        return null;
      }

      const game = response.data.results[0];
      const detailedGame = await this.getGameDetails(game.id);

      return {
        title: detailedGame.name,
        description: detailedGame.description_raw,
        platforms: detailedGame.platforms.map((p) => p.platform.name),
        releaseDate: detailedGame.released,
        rating: detailedGame.rating,
        coverImage: detailedGame.background_image,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch game data: ${error.message}`);
      
      if (error instanceof AxiosError) {
        throw new HttpException(
          `RAWG API Error: ${error.response?.data?.message || error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      throw new HttpException(
        'Failed to fetch game data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getGameDetails(gameId: number): Promise<RawgGameResponse> {
    try {
      const response = await axios.get<RawgGameResponse>(
        `${this.baseUrl}/games/${gameId}`,
        {
          params: {
            key: this.apiKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch game details: ${error.message}`);
      throw error;
    }
  }
}
