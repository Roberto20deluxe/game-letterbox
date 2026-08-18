import { Controller, Get, Query } from '@nestjs/common';
import { RankBacklogQueryDto } from './rank-backlog.dto';
import { RankBacklogHandler } from './rank-backlog.handler';
import {
  SuggestionResponse,
  toSuggestionResponse,
} from './suggestion.presenter';

@Controller('games')
export class RankBacklogController {
  constructor(private readonly handler: RankBacklogHandler) {}

  // `/games/backlog` and `/games/:id` are literal-versus-wildcard on the same
  // path, and they now live in different controllers. Nest resolves them in the
  // order the module lists the controllers, so this one has to be registered
  // before GetGameController or the wildcard swallows it. The module says so.
  @Get('backlog')
  async backlog(
    @Query() query: RankBacklogQueryDto,
  ): Promise<SuggestionResponse[]> {
    const ranked = await this.handler.handle(query.limit);
    return ranked.map(toSuggestionResponse);
  }
}
