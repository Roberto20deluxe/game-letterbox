import { Game, GameStatus } from './game';

// A class rather than an interface so the OpenAPI document can describe it: the
// Swagger plugin reads types and doc comments off classes, and interfaces are
// gone by the time it looks.
export class GameResponse {
  id: string;

  /** @example "Hollow Knight" */
  title: string;

  /** @example "Metroidvania" */
  genre: string;

  /** @example "PC" */
  platform: string;

  releaseDate: string;

  description: string;

  /** De 0 a 10. Zero significa que ainda não avaliei. */
  rating: number;

  /** Horas para zerar. Nulo quando não pesquisei. */
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
