import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  documentApi(app);

  // Binding to every interface is what makes the container reachable from
  // outside itself; the loopback default would only answer from within.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

function documentApi(app: Parameters<typeof SwaggerModule.createDocument>[0]) {
  const spec = new DocumentBuilder()
    .setTitle('Game Letterbox')
    .setDescription(
      'Catálogo pessoal de jogos, com uma sugestão de o que jogar em seguida ' +
        'a partir das notas que já dei. Cada endpoint abaixo pode ser disparado ' +
        'daqui pelo botão "Try it out".',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, spec), {
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  });
}

void bootstrap();
