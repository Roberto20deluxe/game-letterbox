import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { GAME_STATUSES } from '../../shared/game';
import type { GameStatus } from '../../shared/game';

export class CreateGameDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(60)
  genre: string;

  @IsString()
  @MaxLength(60)
  platform: string;

  @Type(() => Date)
  @IsDate()
  releaseDate: Date;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsIn(GAME_STATUSES)
  status?: GameStatus;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  hoursToBeat?: number;
}
