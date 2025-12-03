import { Module } from '@nestjs/common';
import { GraphQLModule as CoreGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@app/common';
import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLDefinitionsEnum } from '../config/enums/graphql-definitions.enum';

@Module({
  imports: [
    CoreGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): ApolloDriverConfig => ({
        playground: configService.get<boolean>(
          `${ConfigEnum.GRAPHQL}.playground`,
        ),
        autoSchemaFile: configService.get<string>(
          `${ConfigEnum.GRAPHQL}.autoSchemaFile`,
        ),
        plugins: configService.get<ApolloServerPlugin[]>(
          `${ConfigEnum.GRAPHQL}.plugins`,
        ),
        sortSchema: configService.get<boolean>(
          `${ConfigEnum.GRAPHQL}.sortSchema`,
        ),
        definitions: {
          path: configService.get<string>(
            `${ConfigEnum.GRAPHQL}.definitions.path`,
          ),
          outputAs: configService.get<GraphQLDefinitionsEnum>(
            `${ConfigEnum.GRAPHQL}.definitions.outputAs`,
          ),
        },
        graphiql: configService.get<boolean>(`${ConfigEnum.GRAPHQL}.`),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class GraphQLModule {}
