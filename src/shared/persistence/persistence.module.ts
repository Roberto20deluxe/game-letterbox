import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GAME_REPOSITORY } from '../game.repository';
import { InMemoryGameRepository } from './in-memory/in-memory-game.repository';
import { GameSchema } from './typeorm/game.schema';
import { TypeOrmGameRepository } from './typeorm/typeorm-game.repository';

export type PersistenceDriver = 'memory' | 'postgres';

export function resolveDriver(
  value = process.env.DB_DRIVER,
): PersistenceDriver {
  return value === 'postgres' ? 'postgres' : 'memory';
}

@Module({})
export class PersistenceModule {
  static register(driver: PersistenceDriver = resolveDriver()): DynamicModule {
    if (driver === 'memory') {
      return {
        module: PersistenceModule,
        providers: [
          { provide: GAME_REPOSITORY, useClass: InMemoryGameRepository },
        ],
        exports: [GAME_REPOSITORY],
      };
    }

    return {
      module: PersistenceModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.DATABASE_URL,
          entities: [GameSchema],
          // Render provisions Postgres behind TLS with a certificate the container
          // does not carry a root for, so verification has to be relaxed there.
          ssl: process.env.DATABASE_SSL === 'true' && {
            rejectUnauthorized: false,
          },
          synchronize: process.env.DB_SYNCHRONIZE === 'true',
        }),
        TypeOrmModule.forFeature([GameSchema]),
      ],
      providers: [
        { provide: GAME_REPOSITORY, useClass: TypeOrmGameRepository },
      ],
      exports: [GAME_REPOSITORY],
    };
  }
}
