import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { RankedGame } from './backlog-ranker';

export interface SuggestionResponse {
  game: GameResponse;
  score: number;
  because: {
    /** How well the genre matches what I have rated highly, from 0 to 1. */
    genreMatch: number;
    /** How short the game is, from 0 to 1. */
    shortness: number;
    /** How long it has waited for a turn, from 0 to 1. */
    waiting: number;
  };
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
