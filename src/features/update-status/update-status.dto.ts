import { IsIn } from 'class-validator';
import { GAME_STATUSES } from '../../shared/game';
import type { GameStatus } from '../../shared/game';

export class UpdateStatusDto {
  @IsIn(GAME_STATUSES)
  status: GameStatus;
}
