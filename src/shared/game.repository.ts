import { Game } from './game';

export const GAME_REPOSITORY = Symbol('GAME_REPOSITORY');

export interface GameRepository {
  save(game: Game): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  findAll(filters?: GameFilters): Promise<Game[]>;
  delete(id: string): Promise<void>;
}

export interface GameFilters {
  genre?: string;
  platform?: string;
  status?: Game['status'];
}
