import { Injectable } from '@nestjs/common';
import { Game } from '../../game';
import { GameFilters, GameRepository } from '../../game.repository';

@Injectable()
export class InMemoryGameRepository implements GameRepository {
  private readonly store = new Map<string, Game>();

  save(game: Game): Promise<Game> {
    this.store.set(game.id, snapshot(game));
    return Promise.resolve(game);
  }

  findById(id: string): Promise<Game | null> {
    const stored = this.store.get(id);
    return Promise.resolve(stored ? snapshot(stored) : null);
  }

  findAll(filters: GameFilters = {}): Promise<Game[]> {
    const matches = [...this.store.values()]
      .filter(
        (game) =>
          (!filters.genre || game.genre === filters.genre) &&
          (!filters.platform || game.platform === filters.platform) &&
          (!filters.status || game.status === filters.status),
      )
      .map(snapshot);

    return Promise.resolve(matches);
  }

  delete(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }
}

// A real database hands back a fresh row on every read, so handing out the
// stored instance would let callers mutate the store without saving and make
// this adapter behave unlike the Postgres one.
function snapshot(game: Game): Game {
  return new Game({
    ...game,
    releaseDate: new Date(game.releaseDate),
    createdAt: new Date(game.createdAt),
    updatedAt: new Date(game.updatedAt),
  });
}
