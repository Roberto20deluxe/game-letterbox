import { Game, GameStatus } from './game';

export interface GameResponse {
  id: string;
  title: string;
  genre: string;
  platform: string;
  releaseDate: string;
  description: string;
  rating: number;
  hoursToBeat: number | null;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
}

// Shared on purpose: every slice that answers with a game answers with this
// shape, and a caller should not have to learn a new one per endpoint.
export function toGameResponse(game: Game): GameResponse {
  return {
    id: game.id,
    title: game.title,
    genre: game.genre,
    platform: game.platform,
    releaseDate: game.releaseDate.toISOString(),
    description: game.description,
    rating: game.rating,
    hoursToBeat: game.hoursToBeat ?? null,
    status: game.status,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}
