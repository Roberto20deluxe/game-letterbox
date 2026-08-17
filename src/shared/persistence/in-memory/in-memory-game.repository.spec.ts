import { itBehavesLikeAGameRepository } from '../game-repository.contract';
import { InMemoryGameRepository } from './in-memory-game.repository';

itBehavesLikeAGameRepository('InMemoryGameRepository', () => {
  const repository = new InMemoryGameRepository();

  return Promise.resolve({
    repository,
    clear: () => repository.clear(),
  });
});
