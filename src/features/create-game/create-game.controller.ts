import { Body, Controller, Post } from '@nestjs/common';
import { GameResponse, toGameResponse } from '../../shared/game.presenter';
import { CreateGameDto } from './create-game.dto';
import { CreateGameHandler } from './create-game.handler';

@Controller('games')
export class CreateGameController {
  constructor(private readonly handler: CreateGameHandler) {}

  @Post()
  async create(@Body() dto: CreateGameDto): Promise<GameResponse> {
    return toGameResponse(await this.handler.handle(dto));
  }
}
