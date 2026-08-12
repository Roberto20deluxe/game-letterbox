import { InvalidHoursToBeatError, InvalidRatingError } from './errors';

export type GameStatus = 'playing' | 'completed' | 'dropped' | 'backlog';

/** The same values at runtime, for the slices that have to validate input. */
export const GAME_STATUSES: GameStatus[] = [
  'playing',
  'completed',
  'dropped',
  'backlog',
];

export interface GameProps {
  id: string;
  title: string;
  genre: string;
  platform: string;
  releaseDate: Date;
  description: string;
  status?: GameStatus;
  rating?: number;
  hoursToBeat?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Game {
  readonly id: string;
  title: string;
  genre: string;
  platform: string;
  releaseDate: Date;
  description: string;
  rating: number;
  status: GameStatus;
  /** How long the game takes to finish. Absent when I have not looked it up. */
  hoursToBeat?: number;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: GameProps) {
    this.id = props.id;
    this.title = props.title;
    this.genre = props.genre;
    this.platform = props.platform;
    this.releaseDate = props.releaseDate;
    this.description = props.description;
    this.rating = Game.assertValidRating(props.rating ?? 0);
    this.status = props.status ?? 'backlog';
    this.hoursToBeat = Game.assertValidHoursToBeat(props.hoursToBeat);
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  updateRating(newRating: number): void {
    this.rating = Game.assertValidRating(newRating);
    this.updatedAt = new Date();
  }

  updateStatus(newStatus: GameStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /** A game I have formed an opinion on, and so can learn my taste from. */
  isRated(): boolean {
    return this.rating > 0;
  }

  daysWaiting(now: Date): number {
    const elapsed = now.getTime() - this.createdAt.getTime();
    return Math.max(0, elapsed / MILLIS_PER_DAY);
  }

  private static assertValidRating(rating: number): number {
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      throw new InvalidRatingError(rating);
    }
    return rating;
  }

  private static assertValidHoursToBeat(hours?: number): number | undefined {
    if (hours === undefined) {
      return undefined;
    }
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new InvalidHoursToBeatError(hours);
    }
    return hours;
  }
}

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
