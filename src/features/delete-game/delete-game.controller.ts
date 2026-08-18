import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteGameHandler } from './delete-game.handler';

@ApiTags('jogos')
@Controller('games')
export class DeleteGameController {
  constructor(private readonly handler: DeleteGameHandler) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um jogo do catálogo' })
  @ApiResponse({ status: 204, description: 'Removido' })
  @ApiResponse({ status: 404, description: 'Não existe jogo com esse id' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.handler.handle(id);
  }
}
