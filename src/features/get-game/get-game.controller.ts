import { Controller, Get, Param } from '@nestjs/common';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { GetGameHandler } from './get-game.handler';

@Controller('games')
export class GetGameController {
  constructor(private readonly handler: GetGameHandler) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(id));
  }
}
