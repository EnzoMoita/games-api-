export interface RawgPlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface RawgStore {
  store: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface RawgGameResponse {
  id: number;
  slug: string;
  name: string;
  description_raw: string;
  released: string;
  background_image: string;
  rating: number;
  rating_top: number;
  metacritic: number;
  playtime: number;
  platforms: RawgPlatform[];
  stores: RawgStore[];
}

export interface RawgSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGameResponse[];
}