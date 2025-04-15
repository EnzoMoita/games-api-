export interface RawgGamePlatform {
    platform: {
      id: number;
      name: string;
      slug: string;
    };
  }
  
  export interface RawgGameStore {
    store: {
      id: number;
      name: string;
      slug: string;
    };
  }
  
  export interface RawgGameRating {
    id: number;
    title: string;
    count: number;
    percent: number;
  }
  
  export interface RawgGameResponse {
    id: number;
    slug: string;
    name: string;
    description_raw?: string;
    released: string;
    background_image: string;
    rating: number;
    rating_top: number;
    ratings: RawgGameRating[];
    ratings_count: number;
    metacritic: number;
    playtime: number;
    platforms: RawgGamePlatform[];
    stores: RawgGameStore[];
  }
  
  export interface RawgSearchResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: RawgGameResponse[];
  }