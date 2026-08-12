import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Game } from '../../shared/game';
import { GAME_REPOSITORY } from '../../shared/game.repository';
import type { GameRepository } from '../../shared/game.repository';
import { CreateGameDto } from './create-game.dto';

@Injectable()
export class CreateGameHandler {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
  ) {}

  async handle(input: CreateGameDto): Promise<Game> {
    const game = new Game({ id: randomUUID(), ...input });
    return this.games.save(game);
  }
}
