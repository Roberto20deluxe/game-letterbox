import { Module } from '@nestjs/common';
import { CreateGameController } from './features/create-game/create-game.controller';
import { CreateGameHandler } from './features/create-game/create-game.handler';
import { DeleteGameController } from './features/delete-game/delete-game.controller';
import { DeleteGameHandler } from './features/delete-game/delete-game.handler';
import { GetGameController } from './features/get-game/get-game.controller';
import { GetGameHandler } from './features/get-game/get-game.handler';
import { ListGamesController } from './features/list-games/list-games.controller';
import { ListGamesHandler } from './features/list-games/list-games.handler';
import {
  BacklogRanker,
  DEFAULT_WEIGHTS,
} from './features/rank-backlog/backlog-ranker';
import { RankBacklogController } from './features/rank-backlog/rank-backlog.controller';
import { RankBacklogHandler } from './features/rank-backlog/rank-backlog.handler';
import { RateGameController } from './features/rate-game/rate-game.controller';
import { RateGameHandler } from './features/rate-game/rate-game.handler';
import { UpdateStatusController } from './features/update-status/update-status.controller';
import { UpdateStatusHandler } from './features/update-status/update-status.handler';
import { PersistenceModule } from './shared/persistence/persistence.module';

@Module({
  imports: [PersistenceModule.register()],
  // Order matters here, and only here: RankBacklogController answers the literal
  // /games/backlog while GetGameController answers /games/:id. Nest matches in
  // registration order, so the literal has to come first or the wildcard takes
  // it and tries to read "backlog" as an id.
  controllers: [
    CreateGameController,
    ListGamesController,
    RankBacklogController,
    GetGameController,
    RateGameController,
    UpdateStatusController,
    DeleteGameController,
  ],
  providers: [
    CreateGameHandler,
    ListGamesHandler,
    GetGameHandler,
    RateGameHandler,
    UpdateStatusHandler,
    DeleteGameHandler,
    RankBacklogHandler,
    // Built by hand rather than decorated: the ranking rule is plain code and
    // should stay usable without NestJS around it.
    {
      provide: BacklogRanker,
      useFactory: () => new BacklogRanker(DEFAULT_WEIGHTS),
    },
  ],
})
export class GamesModule {}
