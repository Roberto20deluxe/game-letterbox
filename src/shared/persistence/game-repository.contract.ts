import { Game, GameProps } from '../game';
import { GameRepository } from '../game.repository';

export interface RepositoryHarness {
  repository: GameRepository;
  clear: () => Promise<void>;
  teardown?: () => Promise<void>;
}

function aGame(overrides: Partial<GameProps> = {}): Game {
  return new Game({
    id: crypto.randomUUID(),
    title: 'Hollow Knight',
    genre: 'metroidvania',
    platform: 'pc',
    releaseDate: new Date('2017-02-24'),
    description: 'Exploracao em Hallownest.',
    ...overrides,
  });
}

/**
 * Every adapter behind GameRepository has to pass this suite. It is the only
 * guarantee that swapping the in-memory store for Postgres does not quietly
 * change what the use cases observe.
 */
export function itBehavesLikeAGameRepository(
  name: string,
  createHarness: () => Promise<RepositoryHarness>,
): void {
  describe(`${name} as a GameRepository`, () => {
    let harness: RepositoryHarness;
    let repository: GameRepository;

    beforeAll(async () => {
      harness = await createHarness();
      repository = harness.repository;
    });

    beforeEach(async () => {
      await harness.clear();
    });

    afterAll(async () => {
      await harness.teardown?.();
    });

    it('reads back every field it was given', async () => {
      const game = aGame({ rating: 9.5, status: 'completed' });

      await repository.save(game);
      const found = await repository.findById(game.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(game.id);
      expect(found!.title).toBe(game.title);
      expect(found!.genre).toBe(game.genre);
      expect(found!.platform).toBe(game.platform);
      expect(found!.description).toBe(game.description);
      expect(found!.status).toBe('completed');
      expect(found!.releaseDate.toISOString().slice(0, 10)).toBe('2017-02-24');
    });

    it('keeps the rating a number rather than whatever the driver returns', async () => {
      const game = aGame({ rating: 8.5 });

      await repository.save(game);
      const found = await repository.findById(game.id);

      expect(typeof found!.rating).toBe('number');
      expect(found!.rating).toBe(8.5);
    });

    it('keeps an absent length absent instead of turning it into a zero', async () => {
      const game = aGame({ hoursToBeat: undefined });

      await repository.save(game);
      const found = await repository.findById(game.id);

      expect(found!.hoursToBeat).toBeUndefined();
    });

    it('reads a stored length back as a number', async () => {
      const game = aGame({ hoursToBeat: 26.5 });

      await repository.save(game);
      const found = await repository.findById(game.id);

      expect(typeof found!.hoursToBeat).toBe('number');
      expect(found!.hoursToBeat).toBe(26.5);
    });

    it('returns null for an id it never stored', async () => {
      expect(await repository.findById(crypto.randomUUID())).toBeNull();
    });

    it('overwrites a game saved under an id it already holds', async () => {
      const game = aGame({ rating: 5 });
      await repository.save(game);

      game.updateRating(7);
      await repository.save(game);

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].rating).toBe(7);
    });

    it('does not let an unsaved change reach storage', async () => {
      const game = aGame({ rating: 4 });
      await repository.save(game);

      game.updateRating(10);

      const found = await repository.findById(game.id);
      expect(found!.rating).toBe(4);
    });

    it('lists everything when no filter is given', async () => {
      await repository.save(aGame({ title: 'Celeste' }));
      await repository.save(aGame({ title: 'Blasphemous' }));

      expect(await repository.findAll()).toHaveLength(2);
    });

    it('filters by a single field', async () => {
      await repository.save(aGame({ platform: 'pc', genre: 'metroidvania' }));
      await repository.save(aGame({ platform: 'switch', genre: 'plataforma' }));

      const onPc = await repository.findAll({ platform: 'pc' });

      expect(onPc).toHaveLength(1);
      expect(onPc[0].platform).toBe('pc');
    });

    it('requires every given filter to match at once', async () => {
      await repository.save(
        aGame({ platform: 'pc', genre: 'metroidvania', status: 'completed' }),
      );
      await repository.save(
        aGame({ platform: 'pc', genre: 'metroidvania', status: 'backlog' }),
      );

      const matches = await repository.findAll({
        platform: 'pc',
        genre: 'metroidvania',
        status: 'completed',
      });

      expect(matches).toHaveLength(1);
      expect(matches[0].status).toBe('completed');
    });

    it('returns nothing when a filter matches no game', async () => {
      await repository.save(aGame({ platform: 'pc' }));

      expect(await repository.findAll({ platform: 'ps5' })).toEqual([]);
    });

    it('removes a game it holds', async () => {
      const game = aGame();
      await repository.save(game);

      await repository.delete(game.id);

      expect(await repository.findById(game.id)).toBeNull();
    });

    it('stays quiet when asked to delete an id it never held', async () => {
      await expect(
        repository.delete(crypto.randomUUID()),
      ).resolves.toBeUndefined();
    });
  });
}
