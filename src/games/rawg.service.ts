import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RawgGameResponse, RawgSearchResponse } from './interfaces/rawg.interface';
import axios from 'axios';

@Injectable()
export class RawgService {
  private readonly apiKey = process.env.RAWG_API_KEY;
  private readonly baseUrl = 'https://api.rawg.io/api';

  async searchGames(title: string): Promise<RawgSearchResponse> {
    try {
      const response = await axios.get<RawgSearchResponse>(`${this.baseUrl}/games`, {
        params: {
          search: title,
          key: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error('RAWG API Error:', error);
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    }
  }

  async searchGame(title: string): Promise<RawgGameResponse | null> {
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

      return detailedGame;
    } catch (error) {
      console.error('RAWG API Error:', error);
      return null;
    }
  }

  private async getGameDetails(gameId: number): Promise<RawgGameResponse> {
    const response = await axios.get<RawgGameResponse>(
      `${this.baseUrl}/games/${gameId}`,
      {
        params: {
          key: this.apiKey,
        },
      },
    );
    return response.data;
  }
}