import { Controller, Get, Query } from '@nestjs/common';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { ListGamesQueryDto } from './list-games.dto';
import { ListGamesHandler } from './list-games.handler';

@Controller('games')
export class ListGamesController {
  constructor(private readonly handler: ListGamesHandler) {}

  @Get()
  async list(@Query() query: ListGamesQueryDto): Promise<GameResponse[]> {
    const games = await this.handler.handle(query);
    return games.map(toGameResponse);
  }
}
