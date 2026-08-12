import { Body, Controller, Param, Patch } from '@nestjs/common';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { UpdateStatusDto } from './update-status.dto';
import { UpdateStatusHandler } from './update-status.handler';

@Controller('games')
export class UpdateStatusController {
  constructor(private readonly handler: UpdateStatusHandler) {}

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(id, dto.status));
  }
}
