import { Game } from '../../shared/game';

export interface RankingWeights {
  /** How much my taste for the genre counts. */
  affinity: number;
  /** How much a short game counts. */
  brevity: number;
  /** How much sitting untouched in the backlog counts. */
  patience: number;
}

export interface ScoreBreakdown {
  affinity: number;
  brevity: number;
  patience: number;
}

export interface RankedGame {
  game: Game;
  score: number;
  breakdown: ScoreBreakdown;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  affinity: 0.5,
  brevity: 0.2,
  patience: 0.3,
};

/**
 * Ratings I have not given yet should not swing a genre's average, so each
 * genre is pulled towards the overall average until enough ratings exist to
 * speak for it. This is the count that counts as "enough".
 */
const CONFIDENCE_PRIOR = 3;

/** The rating a genre is assumed to deserve before I have rated anything at all. */
const NEUTRAL_RATING = 5;

/** The length at which a game scores half of the brevity points. */
const HALF_BREVITY_HOURS = 20;

/** The wait at which a game scores half of the patience points. */
const HALF_PATIENCE_DAYS = 30;

/**
 * Decides what to play next out of the backlog.
 *
 * Pure by design: it receives the games it should consider and the current time,
 * and reaches for nothing. That keeps the ranking rule testable without a
 * database and keeps the decision itself in the domain rather than in a service
 * that happens to also know how to query.
 */
export class BacklogRanker {
  constructor(private readonly weights: RankingWeights = DEFAULT_WEIGHTS) {}

  /**
   * `history` is every game I have rated, whatever its status — a game I
   * dropped at 3 says as much about my taste as one I finished at 9.
   *
   * O(h + b log b) for h rated games and b in the backlog: one pass to learn the
   * taste, one to score, and the sort. Memory is O(g) for the genres seen.
   */
  rank(backlog: Game[], history: Game[], now: Date): RankedGame[] {
    const taste = this.learnTaste(history);

    return backlog
      .map((game) => this.score(game, taste, now))
      .sort(byScoreThenTitle);
  }

  private score(game: Game, taste: GenreTaste, now: Date): RankedGame {
    const breakdown: ScoreBreakdown = {
      affinity: taste.affinityFor(game.genre),
      brevity: brevityOf(game),
      patience: patienceOf(game, now),
    };

    const score =
      this.weights.affinity * breakdown.affinity +
      this.weights.brevity * breakdown.brevity +
      this.weights.patience * breakdown.patience;

    return { game, score, breakdown };
  }

  private learnTaste(history: Game[]): GenreTaste {
    const rated = history.filter((game) => game.isRated());
    return new GenreTaste(rated);
  }
}

/** What my ratings say about each genre, held as a 0..1 score. */
class GenreTaste {
  private readonly totals = new Map<string, { sum: number; count: number }>();
  private readonly overallAverage: number;

  constructor(rated: Game[]) {
    for (const game of rated) {
      const key = normalizeGenre(game.genre);
      const current = this.totals.get(key) ?? { sum: 0, count: 0 };
      this.totals.set(key, {
        sum: current.sum + game.rating,
        count: current.count + 1,
      });
    }

    this.overallAverage = rated.length
      ? rated.reduce((sum, game) => sum + game.rating, 0) / rated.length
      : NEUTRAL_RATING;
  }

  affinityFor(genre: string): number {
    const totals = this.totals.get(normalizeGenre(genre));
    const sum = totals?.sum ?? 0;
    const count = totals?.count ?? 0;

    // One 10 in a genre is not proof that I love it. Blending the genre's own
    // ratings with the overall average, weighted by how many ratings exist,
    // keeps a single opinion from dominating and gives unrated genres a
    // sensible starting point instead of a zero.
    const adjusted =
      (CONFIDENCE_PRIOR * this.overallAverage + sum) /
      (CONFIDENCE_PRIOR + count);

    return adjusted / MAX_RATING;
  }
}

/**
 * Shorter games win, on a curve that never reaches either end. A game with no
 * known length is treated as average rather than punished, since not having
 * looked it up says nothing about the game.
 */
function brevityOf(game: Game): number {
  if (game.hoursToBeat === undefined) {
    return 0.5;
  }
  return HALF_BREVITY_HOURS / (HALF_BREVITY_HOURS + game.hoursToBeat);
}

/** The longer it has waited, the more it deserves a turn, with a ceiling. */
function patienceOf(game: Game, now: Date): number {
  const days = game.daysWaiting(now);
  return days / (days + HALF_PATIENCE_DAYS);
}

// Every component is measured against a fixed reference rather than against the
// rest of the backlog. Min-max normalising would make each game's score depend
// on the others, so adding one 200-hour game would silently rerank everything.
function byScoreThenTitle(a: RankedGame, b: RankedGame): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  return a.game.title.localeCompare(b.game.title);
}

function normalizeGenre(genre: string): string {
  return genre.trim().toLowerCase();
}

const MAX_RATING = 10;
