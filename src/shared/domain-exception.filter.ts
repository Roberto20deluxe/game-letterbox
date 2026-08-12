import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError, GameNotFoundError, InvalidRatingError } from './errors';

type DomainErrorClass = new (...args: never[]) => DomainError;

const STATUS_BY_ERROR = new Map<DomainErrorClass, HttpStatus>([
  [GameNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidRatingError, HttpStatus.UNPROCESSABLE_ENTITY],
]);

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const status =
      STATUS_BY_ERROR.get(error.constructor as DomainErrorClass) ??
      HttpStatus.BAD_REQUEST;

    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      error: error.constructor.name,
      message: error.message,
    });
  }
}
