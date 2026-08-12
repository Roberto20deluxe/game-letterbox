import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { GameResponse } from '../src/shared/game.presenter';
import type { SuggestionResponse } from '../src/features/rank-backlog/suggestion.presenter';
import { DomainExceptionFilter } from '../src/shared/domain-exception.filter';

const hollowKnight = {
  title: 'Hollow Knight',
  genre: 'Metroidvania',
  platform: 'PC',
  releaseDate: '2017-02-24',
  description: 'Explore a ruined kingdom of insects.',
};

describe('Games (e2e)', () => {
  let app: INestApplication;
  let api: Server;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    api = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('walks a game through the full lifecycle', async () => {
    const created = await request(api)
      .post('/games')
      .send(hollowKnight)
      .expect(201);

    const { id } = created.body as GameResponse;
    expect(created.body).toMatchObject({ status: 'backlog', rating: 0 });

    await request(api)
      .patch(`/games/${id}/status`)
      .send({ status: 'completed' })
      .expect(200);

    await request(api)
      .patch(`/games/${id}/rating`)
      .send({ rating: 9.5 })
      .expect(200);

    const fetched = await request(api).get(`/games/${id}`).expect(200);
    expect(fetched.body).toMatchObject({ status: 'completed', rating: 9.5 });

    await request(api).delete(`/games/${id}`).expect(204);
    await request(api).get(`/games/${id}`).expect(404);
  });

  it('filters the collection by platform', async () => {
    await request(api).post('/games').send(hollowKnight);
    await request(api)
      .post('/games')
      .send({ ...hollowKnight, title: 'Celeste', platform: 'Switch' });

    const response = await request(api)
      .get('/games')
      .query({ platform: 'Switch' })
      .expect(200);

    const games = response.body as GameResponse[];
    expect(games).toHaveLength(1);
    expect(games[0].title).toBe('Celeste');
  });

  it('rejects a malformed payload with 400', async () => {
    await request(api)
      .post('/games')
      .send({ ...hollowKnight, title: undefined })
      .expect(400);

    await request(api)
      .post('/games')
      .send({ ...hollowKnight, rating: 'great' })
      .expect(400);
  });

  it('rejects a well-formed payload that breaks a domain rule with 422', async () => {
    const created = await request(api).post('/games').send(hollowKnight);
    const { id } = created.body as GameResponse;

    const response = await request(api)
      .patch(`/games/${id}/rating`)
      .send({ rating: 42 })
      .expect(422);

    expect(response.body).toMatchObject({ error: 'InvalidRatingError' });
  });

  it('returns 404 for an unknown game', async () => {
    await request(api)
      .get('/games/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  describe('backlog suggestions', () => {
    async function rateAndFinish(genre: string, rating: number): Promise<void> {
      const created = await request(api)
        .post('/games')
        .send({ ...hollowKnight, title: `Played ${genre}`, genre });
      const { id } = created.body as GameResponse;

      await request(api)
        .patch(`/games/${id}/status`)
        .send({ status: 'completed' });
      await request(api).patch(`/games/${id}/rating`).send({ rating });
    }

    it('ranks the backlog and says why', async () => {
      // A history that actually says something: I love metroidvanias and bounced
      // off the JRPG. With a single rating on file the overall average would be
      // that rating, and every genre would tie against it.
      await rateAndFinish('Metroidvania', 10);
      await rateAndFinish('JRPG', 3);

      await request(api)
        .post('/games')
        .send({
          ...hollowKnight,
          title: 'Blasphemous',
          genre: 'Metroidvania',
          hoursToBeat: 14,
        });
      await request(api)
        .post('/games')
        .send({
          ...hollowKnight,
          title: 'Persona 5',
          genre: 'JRPG',
          hoursToBeat: 100,
        });

      const response = await request(api).get('/games/backlog').expect(200);

      const suggestions = response.body as SuggestionResponse[];
      expect(suggestions.map((entry) => entry.game.title)).toEqual([
        'Blasphemous',
        'Persona 5',
      ]);
      expect(suggestions[0].because.genreMatch).toBeGreaterThan(
        suggestions[1].because.genreMatch,
      );
      expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
    });

    it('leaves out what is not in the backlog', async () => {
      const created = await request(api).post('/games').send(hollowKnight);
      await request(api)
        .patch(`/games/${(created.body as GameResponse).id}/status`)
        .send({ status: 'playing' });

      const response = await request(api).get('/games/backlog').expect(200);

      expect(response.body).toEqual([]);
    });

    it('honours a limit and rejects a nonsensical one', async () => {
      await request(api).post('/games').send(hollowKnight);
      await request(api)
        .post('/games')
        .send({ ...hollowKnight, title: 'Celeste' });

      const limited = await request(api)
        .get('/games/backlog')
        .query({ limit: 1 })
        .expect(200);
      expect(limited.body).toHaveLength(1);

      await request(api).get('/games/backlog').query({ limit: 0 }).expect(400);
    });

    it('rejects a negative length instead of storing it', async () => {
      await request(api)
        .post('/games')
        .send({ ...hollowKnight, hoursToBeat: -5 })
        .expect(400);
    });
  });
});
