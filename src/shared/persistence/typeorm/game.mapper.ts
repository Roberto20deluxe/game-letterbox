import { Game } from '../../game';
import { GameRow } from './game.schema';

export function toRow(game: Game): GameRow {
  return {
    id: game.id,
    title: game.title,
    genre: game.genre,
    platform: game.platform,
    releaseDate: toCalendarDay(game.releaseDate),
    description: game.description,
    rating: game.rating,
    hoursToBeat: game.hoursToBeat ?? null,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

export function toDomain(row: GameRow): Game {
  return new Game({
    id: row.id,
    title: row.title,
    genre: row.genre,
    platform: row.platform,
    releaseDate: fromCalendarDay(row.releaseDate),
    description: row.description,
    status: row.status,
    // The pg driver returns `numeric` as a string to protect precision it cannot
    // fit in a float, so the rating arrives as "8.5" rather than 8.5.
    rating: Number(row.rating),
    hoursToBeat: row.hoursToBeat === null ? undefined : Number(row.hoursToBeat),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

// A release date is a calendar day and the domain holds it as a Date at UTC
// midnight. Handing that Date to the driver would let it format the column from
// the local components instead, which moves the day backwards anywhere west of
// UTC: 2017-02-24T00:00Z is still the 23rd in UTC-3.
function toCalendarDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fromCalendarDay(day: string | Date): Date {
  return day instanceof Date ? day : new Date(`${day}T00:00:00.000Z`);
}
