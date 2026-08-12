export class DomainError extends Error {}

export class InvalidRatingError extends DomainError {
  constructor(rating: number) {
    super(`Rating must be between 0 and 10, received ${rating}`);
  }
}

export class InvalidHoursToBeatError extends DomainError {
  constructor(hours: number) {
    super(`Hours to beat must be a positive number, received ${hours}`);
  }
}

export class GameNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Game ${id} not found`);
  }
}
