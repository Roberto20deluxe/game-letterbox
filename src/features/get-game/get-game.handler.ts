import { Inject, Injectable } from '@nestjs/common';
import { GameNotFoundError } from '../../shared/errors';
import { Game } from '../../shared/game';
import { GAME_REPOSITORY } from '../../shared/game.repository';
import type { GameRepository } from '../../shared/game.repository';

@Injectable()
export class GetGameHandler {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
  ) {}

  async handle(id: string): Promise<Game> {
    const game = await this.games.findById(id);
    if (!game) {
      throw new GameNotFoundError(id);
    }
    return game;
  }
}
