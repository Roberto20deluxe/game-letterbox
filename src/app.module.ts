import { Module } from '@nestjs/common';
import { GamesModule } from './games.module';

@Module({
  imports: [GamesModule],
})
export class AppModule {}
