import { DataSource } from 'typeorm';
import { itBehavesLikeAGameRepository } from '../game-repository.contract';
import { GameSchema } from './game.schema';
import { TypeOrmGameRepository } from './typeorm-game.repository';

// Only runs where a Postgres is reachable: `docker compose up -d db` locally, or
// the service container in CI. Skipped otherwise so the unit suite stays offline.
const describeWithPostgres = process.env.DATABASE_URL
  ? describe
  : describe.skip;

describeWithPostgres('against a real Postgres', () => {
  itBehavesLikeAGameRepository('TypeOrmGameRepository', async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [GameSchema],
      synchronize: true,
    });

    await dataSource.initialize();
    const rows = dataSource.getRepository(GameSchema);

    return {
      repository: new TypeOrmGameRepository(rows),
      clear: async () => {
        await rows.clear();
      },
      teardown: () => dataSource.destroy(),
    };
  });
});
