import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@app/common';

const logger = new Logger('Bootstrap');

(async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  const consoleLogger = new ConsoleLogger();

  app.useLogger(consoleLogger);

  app.enableShutdownHooks().disable('x-powered-by');

  await app.listen(
    configService.get<string>(`${ConfigEnum.APP}.appPort`)!,
    '0.0.0.0',
  );

  logger.log(
    `Proxy server api application is running on: ${await app.getUrl()}`,
  );
  logger.log(`GraphQL Sandbox is running on: ${await app.getUrl()}/graphql`);
})().catch((e) => logger.error(e));
