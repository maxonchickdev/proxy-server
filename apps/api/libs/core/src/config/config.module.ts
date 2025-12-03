import { Module } from '@nestjs/common';
import { ConfigModule as CoreConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { join } from 'node:path';
import { nodeEnvLoader } from './loaders/node-env.loader';
import { appLoader } from './loaders/app.loader';
import { jwtLoader } from './loaders/jwt.loader';
import { graphqlLoader } from './loaders/graphql.loader';

@Module({
  imports: [
    CoreConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '.env'),
      load: [nodeEnvLoader, appLoader, jwtLoader, graphqlLoader],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development')
          .description('Application enviroment'),

        APP_PORT: Joi.number()
          .port()
          .default(3000)
          .description('Port on which the application will run'),
        APP_REQUEST_TIMEOUT: Joi.number()
          .positive()
          .default(5000)
          .description('Request timeout in milliseconds'),
        APP_LOG_LEVEL: Joi.number().required().description('Logging level'),

        DATABASE_URL: Joi.string()
          .uri({ scheme: ['postgresql', 'postgres'] })
          .required()
          .description('Postgres connection URL'),

        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_TTL: Joi.number().required(),
        JWT_REFRESH_TTL: Joi.number().required(),
      }),
    }),
  ],
})
export class ConfigModule {}
