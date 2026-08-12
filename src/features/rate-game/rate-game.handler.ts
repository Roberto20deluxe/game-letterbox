import { Inject, Injectable } from '@nestjs/common';
import { GameNotFoundError } from '../../shared/errors';
import { Game } from '../../shared/game';
import { GAME_REPOSITORY } from '../../shared/game.repository';
import type { GameRepository } from '../../shared/game.repository';

@Injectable()
export class RateGameHandler {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
  ) {}

  async handle(id: string, rating: number): Promise<Game> {
    const game = await this.games.findById(id);
    if (!game) {
      throw new GameNotFoundError(id);
    }

    // The 0..10 rule lives in the entity, not here: a rating is invalid whether
    // it arrives over HTTP, from a seed script, or from an import.
    game.updateRating(rating);
    return this.games.save(game);
  }
}
