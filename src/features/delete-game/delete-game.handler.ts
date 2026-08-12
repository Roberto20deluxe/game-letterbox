import { Inject, Injectable } from '@nestjs/common';
import { GameNotFoundError } from '../../shared/errors';
import { GAME_REPOSITORY } from '../../shared/game.repository';
import type { GameRepository } from '../../shared/game.repository';

@Injectable()
export class DeleteGameHandler {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
  ) {}

  async handle(id: string): Promise<void> {
    const game = await this.games.findById(id);
    if (!game) {
      throw new GameNotFoundError(id);
    }

    await this.games.delete(id);
  }
}
