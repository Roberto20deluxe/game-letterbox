import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { CreateGameDto } from './create-game.dto';
import { CreateGameHandler } from './create-game.handler';

@ApiTags('jogos')
@Controller('games')
export class CreateGameController {
  constructor(private readonly handler: CreateGameHandler) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um jogo',
    description:
      'Entra no backlog por padrão. `hoursToBeat` é opcional e melhora a ' +
      'sugestão do backlog quando informado.',
  })
  @ApiResponse({ status: 201, type: GameResponse })
  @ApiResponse({ status: 400, description: 'Payload malformado' })
  async create(@Body() dto: CreateGameDto): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(dto));
  }
}
