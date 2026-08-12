import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { DeleteGameHandler } from './delete-game.handler';

@Controller('games')
export class DeleteGameController {
  constructor(private readonly handler: DeleteGameHandler) {}

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.handler.handle(id);
  }
}
