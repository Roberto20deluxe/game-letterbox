import { Inject, Injectable } from '@nestjs/common';
import { Game } from '../../shared/game';
import { GAME_REPOSITORY } from '../../shared/game.repository';
import type { GameFilters, GameRepository } from '../../shared/game.repository';

@Injectable()
export class ListGamesHandler {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
  ) {}

  handle(filters: GameFilters = {}): Promise<Game[]> {
    return this.games.findAll(filters);
  }
}
