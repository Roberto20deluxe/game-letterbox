import { Body, Controller, Param, Patch } from '@nestjs/common';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { RateGameDto } from './rate-game.dto';
import { RateGameHandler } from './rate-game.handler';

@Controller('games')
export class RateGameController {
  constructor(private readonly handler: RateGameHandler) {}

  @Patch(':id/rating')
  async rate(
    @Param('id') id: string,
    @Body() dto: RateGameDto,
  ): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(id, dto.rating));
  }
}
