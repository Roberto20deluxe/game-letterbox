import { IsIn, IsOptional, IsString } from 'class-validator';
import { GAME_STATUSES } from '../../shared/game';
import type { GameStatus } from '../../shared/game';

export class ListGamesQueryDto {
  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsIn(GAME_STATUSES)
  status?: GameStatus;
}
