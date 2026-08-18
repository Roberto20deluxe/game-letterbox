import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RankBacklogQueryDto } from './rank-backlog.dto';
import { RankBacklogHandler } from './rank-backlog.handler';
import {
  SuggestionResponse,
  toSuggestionResponse,
} from './suggestion.presenter';

@ApiTags('backlog')
@Controller('games')
export class RankBacklogController {
  constructor(private readonly handler: RankBacklogHandler) {}

  // `/games/backlog` and `/games/:id` are literal-versus-wildcard on the same
  // path, and they now live in different controllers. Nest resolves them in the
  // order the module lists the controllers, so this one has to be registered
  // before GetGameController or the wildcard swallows it. The module says so.
  @Get('backlog')
  @ApiOperation({
    summary: 'O que jogar agora',
    description:
      'Ordena o backlog somando três sinais: afinidade com o gênero (aprendida ' +
      'das notas que já dei, sem eu declarar preferência), quão curto o jogo é, ' +
      'e há quanto tempo espera. Cada sugestão vem com `because`, a decomposição ' +
      'da nota — um número sozinho não se discute.',
  })
  @ApiResponse({ status: 200, type: [SuggestionResponse] })
  @ApiResponse({ status: 400, description: 'O limite está fora de 1 a 50' })
  async backlog(
    @Query() query: RankBacklogQueryDto,
  ): Promise<SuggestionResponse[]> {
    const ranked = await this.handler.handle(query.limit);
    return ranked.map(toSuggestionResponse);
  }
}
