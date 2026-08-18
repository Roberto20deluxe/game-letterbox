import { Inject, Injectable } from '@nestjs/common';
import { Game } from '../../shared/game';
import { GAME_REPOSITORY } from '../../shared/game.repository';
import type { GameRepository } from '../../shared/game.repository';
import { BacklogRanker, RankedGame } from './backlog-ranker';

@Injectable()
export class RankBacklogHandler {
  constructor(
    @Inject(GAME_REPOSITORY) private readonly games: GameRepository,
    private readonly ranker: BacklogRanker,
  ) {}

  async handle(limit?: number): Promise<RankedGame[]> {
    // One read rather than two: the ranking needs the games waiting in the
    // backlog and every rating I have ever given, and those overlap. Splitting
    // it into two queries would fetch the same rows twice.
    const catalogue = await this.games.findAll();

    const backlog = catalogue.filter(isWaiting);
    const ranked = this.ranker.rank(backlog, catalogue, new Date());

    return limit === undefined ? ranked : ranked.slice(0, limit);
  }
}

function isWaiting(game: Game): boolean {
  return game.status === 'backlog';
}
