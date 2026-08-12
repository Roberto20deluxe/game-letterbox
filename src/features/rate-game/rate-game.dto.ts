import { IsNumber } from 'class-validator';

export class RateGameDto {
  @IsNumber()
  rating: number;
}
