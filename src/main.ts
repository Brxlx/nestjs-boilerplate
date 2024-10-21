import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger: Logger = new Logger('App');

  await app.listen(process.env.PORT ?? 3000, () => {
    logger.log(`Application is running on port ${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
