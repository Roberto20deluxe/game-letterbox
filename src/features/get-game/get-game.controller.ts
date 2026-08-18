import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { GetGameHandler } from './get-game.handler';

@ApiTags('jogos')
@Controller('games')
export class GetGameController {
  constructor(private readonly handler: GetGameHandler) {}

  @Get(':id')
  @ApiOperation({ summary: 'Busca um jogo pelo id' })
  @ApiResponse({ status: 200, type: GameResponse })
  @ApiResponse({ status: 404, description: 'Não existe jogo com esse id' })
  async findOne(@Param('id') id: string): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(id));
  }
}
