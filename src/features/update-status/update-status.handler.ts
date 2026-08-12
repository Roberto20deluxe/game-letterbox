import { Inject, Injectable } from '@nestjs/common';
import { GameNotFoundError } from '../../shared/errors';
import { Game, GameStatus } from '../../shared/game';
import { GAME_REPOSITORY } from '../../shared/game.repository';
import type { GameRepository } from '../../shared/game.repository';

@Injectable()
export class UpdateStatusHandler {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
  ) {}

  async handle(id: string, status: GameStatus): Promise<Game> {
    const game = await this.games.findById(id);
    if (!game) {
      throw new GameNotFoundError(id);
    }

    game.updateStatus(status);
    return this.games.save(game);
  }
}
