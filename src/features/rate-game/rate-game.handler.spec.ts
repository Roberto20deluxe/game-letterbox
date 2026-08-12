import { randomUUID } from 'node:crypto';
import { GameNotFoundError, InvalidRatingError } from '../../shared/errors';
import { Game } from '../../shared/game';
import { InMemoryGameRepository } from '../../shared/persistence/in-memory/in-memory-game.repository';
import { RateGameHandler } from './rate-game.handler';

describe('RateGameHandler', () => {
  let repository: InMemoryGameRepository;
  let rateGame: RateGameHandler;
  let game: Game;

  beforeEach(async () => {
    repository = new InMemoryGameRepository();
    rateGame = new RateGameHandler(repository);

    game = new Game({
      id: randomUUID(),
      title: 'Celeste',
      genre: 'Platformer',
      platform: 'Switch',
      releaseDate: new Date('2018-01-25'),
      description: 'Climb the mountain.',
    });
    await repository.save(game);
  });

  it('persists the new rating', async () => {
    await rateGame.handle(game.id, 10);

    const stored = await repository.findById(game.id);
    expect(stored?.rating).toBe(10);
  });

  it('fails for an unknown game', async () => {
    await expect(rateGame.handle('missing-id', 8)).rejects.toThrow(
      GameNotFoundError,
    );
  });

  it('propagates the domain rule for invalid ratings', async () => {
    await expect(rateGame.handle(game.id, 11)).rejects.toThrow(
      InvalidRatingError,
    );
  });
});
