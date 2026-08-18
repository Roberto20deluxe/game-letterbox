import { Game, GameProps } from '../../shared/game';
import { BacklogRanker, DEFAULT_WEIGHTS } from './backlog-ranker';

const NOW = new Date('2026-08-17T00:00:00.000Z');

let nextId = 0;

function game(props: Partial<GameProps> = {}): Game {
  return new Game({
    id: props.id ?? `game-${++nextId}`,
    title: props.title ?? 'Untitled',
    genre: props.genre ?? 'metroidvania',
    platform: props.platform ?? 'pc',
    releaseDate: props.releaseDate ?? new Date('2017-02-24'),
    description: props.description ?? '',
    status: props.status,
    rating: props.rating,
    hoursToBeat: props.hoursToBeat,
    createdAt: props.createdAt ?? NOW,
  });
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

// Isolating one component at a time lets these tests assert exact numbers
// instead of "bigger than the other one", which would pass even if the formula
// drifted.
const onlyAffinity = new BacklogRanker({
  affinity: 1,
  brevity: 0,
  patience: 0,
});
const onlyBrevity = new BacklogRanker({ affinity: 0, brevity: 1, patience: 0 });
const onlyPatience = new BacklogRanker({
  affinity: 0,
  brevity: 0,
  patience: 1,
});

describe('BacklogRanker', () => {
  describe('taste learned from ratings', () => {
    it('treats every genre the same when nothing has been rated', () => {
      const [ranked] = onlyAffinity.rank([game({ genre: 'rpg' })], [], NOW);

      expect(ranked.breakdown.affinity).toBeCloseTo(0.5, 5);
    });

    it('pulls a genre rated once towards the overall average', () => {
      const history = [
        game({ genre: 'metroidvania', rating: 10, status: 'completed' }),
        game({ genre: 'rpg', rating: 6, status: 'completed' }),
        game({ genre: 'rpg', rating: 6, status: 'completed' }),
        game({ genre: 'rpg', rating: 6, status: 'completed' }),
        game({ genre: 'rpg', rating: 6, status: 'completed' }),
      ];

      const ranked = onlyAffinity.rank(
        [game({ genre: 'metroidvania' }), game({ genre: 'rpg' })],
        history,
        NOW,
      );

      // Taken raw, the single 10 would score a perfect 1.0 and the rpgs 0.6.
      // Blended against the 6.8 overall average it lands at 7.6/10 instead,
      // and the rpgs rise slightly because four ratings speak louder.
      expect(ranked[0].breakdown.affinity).toBeCloseTo(0.76, 5);
      expect(ranked[1].breakdown.affinity).toBeCloseTo(0.634286, 5);
    });

    it('learns from a game I dropped as much as from one I finished', () => {
      const ranked = onlyAffinity.rank(
        [game({ genre: 'soulslike' })],
        [game({ genre: 'soulslike', rating: 2, status: 'dropped' })],
        NOW,
      );

      // The only rating on record is a 2, so the overall average is 2 and the
      // genre cannot score above it.
      expect(ranked[0].breakdown.affinity).toBeCloseTo(0.2, 5);
    });

    it('ignores games left unrated', () => {
      const ranked = onlyAffinity.rank(
        [game({ genre: 'rpg' })],
        [game({ genre: 'rpg', rating: 0, status: 'completed' })],
        NOW,
      );

      expect(ranked[0].breakdown.affinity).toBeCloseTo(0.5, 5);
    });

    it('carries no signal while every rating I gave was the same', () => {
      const ranked = onlyAffinity.rank(
        [game({ genre: 'metroidvania' }), game({ genre: 'jrpg' })],
        [
          game({ genre: 'metroidvania', rating: 10, status: 'completed' }),
          game({ genre: 'metroidvania', rating: 10, status: 'completed' }),
        ],
        NOW,
      );

      // The unrated genre falls back to the overall average, and the overall
      // average is 10, so both come out level. Affinity only starts telling
      // games apart once my ratings disagree with each other.
      expect(ranked[0].breakdown.affinity).toBeCloseTo(1, 5);
      expect(ranked[1].breakdown.affinity).toBeCloseTo(1, 5);
    });

    it('reads a genre the same however it was typed', () => {
      const ranked = onlyAffinity.rank(
        [game({ genre: 'Metroidvania' })],
        [game({ genre: '  metroidvania ', rating: 10, status: 'completed' })],
        NOW,
      );

      expect(ranked[0].breakdown.affinity).toBeCloseTo(1, 5);
    });
  });

  describe('shorter games', () => {
    it('scores a game against a fixed reference, not against the others', () => {
      const [short, reference, long] = onlyBrevity.rank(
        [
          game({ title: 'A', hoursToBeat: 5 }),
          game({ title: 'B', hoursToBeat: 20 }),
          game({ title: 'C', hoursToBeat: 60 }),
        ],
        [],
        NOW,
      );

      expect(short.breakdown.brevity).toBeCloseTo(0.8, 5);
      expect(reference.breakdown.brevity).toBeCloseTo(0.5, 5);
      expect(long.breakdown.brevity).toBeCloseTo(0.25, 5);
    });

    it('keeps the others untouched when a very long game joins the backlog', () => {
      const before = onlyBrevity.rank([game({ hoursToBeat: 5 })], [], NOW);
      const after = onlyBrevity.rank(
        [game({ hoursToBeat: 5 }), game({ hoursToBeat: 300 })],
        [],
        NOW,
      );

      expect(after[0].score).toBeCloseTo(before[0].score, 10);
    });

    it('treats an unknown length as average rather than as a penalty', () => {
      const [ranked] = onlyBrevity.rank([game()], [], NOW);

      expect(ranked.breakdown.brevity).toBeCloseTo(0.5, 5);
    });
  });

  describe('time spent waiting', () => {
    it('gives nothing to a game added today and half at a month', () => {
      const ranked = onlyPatience.rank(
        [
          game({ title: 'Old', createdAt: daysAgo(30) }),
          game({ title: 'New', createdAt: NOW }),
        ],
        [],
        NOW,
      );

      expect(ranked[0].breakdown.patience).toBeCloseTo(0.5, 5);
      expect(ranked[1].breakdown.patience).toBeCloseTo(0, 5);
    });

    it('keeps climbing without ever reaching one', () => {
      const [ranked] = onlyPatience.rank(
        [game({ createdAt: daysAgo(3650) })],
        [],
        NOW,
      );

      expect(ranked.breakdown.patience).toBeGreaterThan(0.99);
      expect(ranked.breakdown.patience).toBeLessThan(1);
    });
  });

  describe('the ranking itself', () => {
    it('combines the three parts using the given weights', () => {
      const ranker = new BacklogRanker({
        affinity: 0.5,
        brevity: 0.2,
        patience: 0.3,
      });

      const [ranked] = ranker.rank(
        [game({ hoursToBeat: 20, createdAt: daysAgo(30) })],
        [],
        NOW,
      );

      // 0.5 * 0.5 + 0.2 * 0.5 + 0.3 * 0.5
      expect(ranked.score).toBeCloseTo(0.5, 5);
    });

    it('puts the higher score first', () => {
      const ranked = new BacklogRanker(DEFAULT_WEIGHTS).rank(
        [
          game({ title: 'Long and new', hoursToBeat: 120, createdAt: NOW }),
          game({
            title: 'Short and waiting',
            hoursToBeat: 6,
            createdAt: daysAgo(200),
          }),
        ],
        [],
        NOW,
      );

      expect(ranked.map((entry) => entry.game.title)).toEqual([
        'Short and waiting',
        'Long and new',
      ]);
    });

    it('breaks a tie by title so the order never wobbles', () => {
      const ranked = new BacklogRanker(DEFAULT_WEIGHTS).rank(
        [
          game({ title: 'Tunic', hoursToBeat: 12 }),
          game({ title: 'Celeste', hoursToBeat: 12 }),
        ],
        [],
        NOW,
      );

      expect(ranked.map((entry) => entry.game.title)).toEqual([
        'Celeste',
        'Tunic',
      ]);
    });

    it('returns nothing for an empty backlog', () => {
      expect(new BacklogRanker().rank([], [], NOW)).toEqual([]);
    });

    it('leaves the backlog it was given alone', () => {
      const backlog = [
        game({ title: 'Z', hoursToBeat: 100 }),
        game({ title: 'A', hoursToBeat: 2 }),
      ];

      new BacklogRanker().rank(backlog, [], NOW);

      expect(backlog.map((entry) => entry.title)).toEqual(['Z', 'A']);
    });
  });
});
