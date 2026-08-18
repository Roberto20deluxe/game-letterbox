import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { UpdateStatusDto } from './update-status.dto';
import { UpdateStatusHandler } from './update-status.handler';

@ApiTags('jogos')
@Controller('games')
export class UpdateStatusController {
  constructor(private readonly handler: UpdateStatusHandler) {}

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Muda o status',
    description:
      'Sair do backlog tira o jogo das sugestões. Jogos avaliados continuam ' +
      'ensinando o gosto, mesmo os que larguei.',
  })
  @ApiResponse({ status: 200, type: GameResponse })
  @ApiResponse({ status: 400, description: 'Status fora da lista permitida' })
  @ApiResponse({ status: 404, description: 'Não existe jogo com esse id' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(id, dto.status));
  }
}
