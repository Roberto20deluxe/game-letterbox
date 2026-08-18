import { Game, GameProps } from '../../shared/game';
import { BacklogRanker } from './backlog-ranker';
import { InMemoryGameRepository } from '../../shared/persistence/in-memory/in-memory-game.repository';
import { RankBacklogHandler } from './rank-backlog.handler';

let nextId = 0;

function game(props: Partial<GameProps> = {}): Game {
  return new Game({
    id: `game-${++nextId}`,
    title: props.title ?? 'Untitled',
    genre: props.genre ?? 'metroidvania',
    platform: 'pc',
    releaseDate: new Date('2017-02-24'),
    description: '',
    ...props,
  });
}

describe('RankBacklogHandler', () => {
  let repository: InMemoryGameRepository;
  let prioritize: RankBacklogHandler;

  beforeEach(() => {
    repository = new InMemoryGameRepository();
    prioritize = new RankBacklogHandler(repository, new BacklogRanker());
  });

  it('only ever suggests games still waiting in the backlog', async () => {
    await repository.save(game({ title: 'Waiting', status: 'backlog' }));
    await repository.save(game({ title: 'Playing', status: 'playing' }));
    await repository.save(game({ title: 'Finished', status: 'completed' }));
    await repository.save(game({ title: 'Abandoned', status: 'dropped' }));

    const ranked = await prioritize.handle();

    expect(ranked.map((entry) => entry.game.title)).toEqual(['Waiting']);
  });

  it('learns my taste from games outside the backlog', async () => {
    await repository.save(
      game({ genre: 'metroidvania', rating: 10, status: 'completed' }),
    );
    await repository.save(
      game({ genre: 'soulslike', rating: 2, status: 'dropped' }),
    );
    await repository.save(
      game({ title: 'Another metroidvania', genre: 'metroidvania' }),
    );
    await repository.save(
      game({ title: 'Another soulslike', genre: 'soulslike' }),
    );

    const ranked = await prioritize.handle();

    expect(ranked.map((entry) => entry.game.title)).toEqual([
      'Another metroidvania',
      'Another soulslike',
    ]);
  });

  it('returns only as many suggestions as asked for', async () => {
    await repository.save(game({ title: 'A' }));
    await repository.save(game({ title: 'B' }));
    await repository.save(game({ title: 'C' }));

    expect(await prioritize.handle(2)).toHaveLength(2);
  });

  it('has nothing to suggest from an empty catalogue', async () => {
    expect(await prioritize.handle()).toEqual([]);
  });

  it('has nothing to suggest when everything is already in progress', async () => {
    await repository.save(game({ status: 'playing' }));

    expect(await prioritize.handle()).toEqual([]);
  });
});
