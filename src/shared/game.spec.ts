import { InvalidRatingError } from './errors';
import { Game } from './game';

function makeGame(rating?: number): Game {
  return new Game({
    id: 'id-1',
    title: 'Hollow Knight',
    genre: 'Metroidvania',
    platform: 'PC',
    releaseDate: new Date('2017-02-24'),
    description: 'Explore a ruined kingdom of insects.',
    rating,
  });
}

describe('Game', () => {
  it('starts unrated and in the backlog by default', () => {
    const game = makeGame();

    expect(game.rating).toBe(0);
    expect(game.status).toBe('backlog');
  });

  it('accepts a rating within the allowed range', () => {
    const game = makeGame();

    game.updateRating(9.5);

    expect(game.rating).toBe(9.5);
  });

  it.each([-1, 10.1, Number.NaN])('rejects the rating %p', (rating) => {
    const game = makeGame();

    expect(() => game.updateRating(rating)).toThrow(InvalidRatingError);
  });

  it('rejects an out-of-range rating at construction time', () => {
    expect(() => makeGame(42)).toThrow(InvalidRatingError);
  });

  it('keeps the previous rating when a new one is rejected', () => {
    const game = makeGame(7);

    expect(() => game.updateRating(11)).toThrow(InvalidRatingError);
    expect(game.rating).toBe(7);
  });

  it('moves through the play statuses', () => {
    const game = makeGame();

    game.updateStatus('playing');
    expect(game.status).toBe('playing');

    game.updateStatus('completed');
    expect(game.status).toBe('completed');
  });
});
