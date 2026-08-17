import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Game } from '../../game';
import { GameFilters, GameRepository } from '../../game.repository';
import { toDomain, toRow } from './game.mapper';
import { GameRow, GameSchema } from './game.schema';

@Injectable()
export class TypeOrmGameRepository implements GameRepository {
  constructor(
    @InjectRepository(GameSchema)
    private readonly rows: Repository<GameRow>,
  ) {}

  async save(game: Game): Promise<Game> {
    await this.rows.save(toRow(game));
    return game;
  }

  async findById(id: string): Promise<Game | null> {
    const row = await this.rows.findOneBy({ id });
    return row ? toDomain(row) : null;
  }

  async findAll(filters: GameFilters = {}): Promise<Game[]> {
    const rows = await this.rows.findBy(definedOnly(filters));
    return rows.map(toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.rows.delete({ id });
  }
}

// findBy treats an explicit `undefined` as a column that must be null, so the
// filters have to be stripped down to the keys the caller actually set.
function definedOnly(filters: GameFilters): FindOptionsWhere<GameRow> {
  const where: FindOptionsWhere<GameRow> = {};

  if (filters.genre !== undefined) {
    where.genre = filters.genre;
  }
  if (filters.platform !== undefined) {
    where.platform = filters.platform;
  }
  if (filters.status !== undefined) {
    where.status = filters.status;
  }

  return where;
}
