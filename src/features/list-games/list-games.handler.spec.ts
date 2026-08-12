import { randomUUID } from 'node:crypto';
import { Game, GameProps } from '../../shared/game';
import { InMemoryGameRepository } from '../../shared/persistence/in-memory/in-memory-game.repository';
import { ListGamesHandler } from './list-games.handler';

// Built straight from the entity rather than through the create-game slice: a
// slice's tests should not break because a different slice changed.
function game(props: Partial<GameProps>): Game {
  return new Game({
    id: randomUUID(),
    title: 'Untitled',
    genre: 'Roguelike',
    platform: 'PC',
    releaseDate: new Date('2020-09-17'),
    description: '',
    ...props,
  });
}

describe('ListGamesHandler', () => {
  let repository: InMemoryGameRepository;
  let listGames: ListGamesHandler;

  beforeEach(async () => {
    repository = new InMemoryGameRepository();
    listGames = new ListGamesHandler(repository);

    await repository.save(game({ title: 'Hades', status: 'completed' }));
    await repository.save(
      game({ title: 'Dead Cells', platform: 'Switch', status: 'playing' }),
    );
  });

  it('returns every game when no filter is given', async () => {
    await expect(listGames.handle()).resolves.toHaveLength(2);
  });

  it('filters by platform', async () => {
    const games = await listGames.handle({ platform: 'Switch' });

    expect(games.map((entry) => entry.title)).toEqual(['Dead Cells']);
  });

  it('combines filters', async () => {
    const games = await listGames.handle({
      genre: 'Roguelike',
      status: 'completed',
    });

    expect(games.map((entry) => entry.title)).toEqual(['Hades']);
  });

  it('returns nothing when no game matches', async () => {
    await expect(listGames.handle({ platform: 'PS5' })).resolves.toEqual([]);
  });
});
