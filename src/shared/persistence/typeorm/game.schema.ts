import { EntitySchema } from 'typeorm';
import { GameStatus } from '../../game';

export interface GameRow {
  id: string;
  title: string;
  genre: string;
  platform: string;
  // A `date` column carries a calendar day, not an instant, so it is kept as
  // 'YYYY-MM-DD' here. See the mapper for why letting a Date through corrupts it.
  releaseDate: string;
  description: string;
  rating: number;
  hoursToBeat: number | null;
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const GameSchema = new EntitySchema<GameRow>({
  name: 'game',
  tableName: 'games',
  columns: {
    id: { type: 'uuid', primary: true },
    title: { type: 'varchar', length: 200 },
    genre: { type: 'varchar', length: 60 },
    platform: { type: 'varchar', length: 60 },
    releaseDate: { type: 'date', name: 'release_date' },
    description: { type: 'text' },
    rating: { type: 'numeric', precision: 3, scale: 1 },
    hoursToBeat: {
      type: 'numeric',
      precision: 5,
      scale: 1,
      name: 'hours_to_beat',
      nullable: true,
    },
    status: { type: 'varchar', length: 20 },
    createdAt: { type: 'timestamptz', name: 'created_at' },
    updatedAt: { type: 'timestamptz', name: 'updated_at' },
  },
  indices: [
    { name: 'idx_games_platform', columns: ['platform'] },
    { name: 'idx_games_genre', columns: ['genre'] },
    { name: 'idx_games_status', columns: ['status'] },
  ],
});
