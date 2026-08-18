import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { RateGameDto } from './rate-game.dto';
import { RateGameHandler } from './rate-game.handler';

@ApiTags('jogos')
@Controller('games')
export class RateGameController {
  constructor(private readonly handler: RateGameHandler) {}

  @Patch(':id/rating')
  @ApiOperation({
    summary: 'Avalia um jogo',
    description:
      'A faixa de 0 a 10 é regra de negócio e vive na entidade, não no DTO. ' +
      'Por isso `"abc"` responde 400 (forma) e `42` responde 422 (regra) — ' +
      'são recusas de naturezas diferentes.',
  })
  @ApiResponse({ status: 200, type: GameResponse })
  @ApiResponse({ status: 400, description: 'A nota não é um número' })
  @ApiResponse({ status: 404, description: 'Não existe jogo com esse id' })
  @ApiResponse({ status: 422, description: 'A nota está fora de 0 a 10' })
  async rate(
    @Param('id') id: string,
    @Body() dto: RateGameDto,
  ): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(id, dto.rating));
  }
}
