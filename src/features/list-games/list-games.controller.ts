import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { ListGamesQueryDto } from './list-games.dto';
import { ListGamesHandler } from './list-games.handler';

@ApiTags('jogos')
@Controller('games')
export class ListGamesController {
  constructor(private readonly handler: ListGamesHandler) {}

  @Get()
  @ApiOperation({
    summary: 'Lista o catálogo',
    description: 'Os filtros são combinados com E, não com OU.',
  })
  @ApiResponse({ status: 200, type: [GameResponse] })
  async list(@Query() query: ListGamesQueryDto): Promise<GameResponse[]> {
    const games = await this.handler.handle(query);
    return games.map(toGameResponse);
  }
}
