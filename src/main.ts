import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  // Binding to every interface is what makes the container reachable from
  // outside itself; the loopback default would only answer from within.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
