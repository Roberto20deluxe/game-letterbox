import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { RankedGame } from './backlog-ranker';

/** De onde veio a nota, para a sugestão poder ser discutida. */
export class SuggestionReasons {
  /** Afinidade com o gênero, aprendida das notas que dei. De 0 a 1. */
  genreMatch: number;

  /** Quão curto o jogo é. De 0 a 1. */
  shortness: number;

  /** Há quanto tempo espera na fila. De 0 a 1. */
  waiting: number;
}

export class SuggestionResponse {
  game: GameResponse;

  /** Soma ponderada das três partes abaixo. Quanto maior, mais recomendado. */
  score: number;

  because: SuggestionReasons;
}

// Lives in the slice rather than beside the shared game presenter: no other
// feature answers with a score, and nothing outside this one should have to
// know the ranking exists.
export function toSuggestionResponse(ranked: RankedGame): SuggestionResponse {
  return {
    game: toGameResponse(ranked.game),
    score: round(ranked.score),
    because: {
      genreMatch: round(ranked.breakdown.affinity),
      shortness: round(ranked.breakdown.brevity),
      waiting: round(ranked.breakdown.patience),
    },
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
