import { ConfigEnum } from '@app/common';
import { registerAs } from '@nestjs/config';
import { IGrphQL } from '../interfaces/graphql.interface';
import { join } from 'node:path';
import { GraphQLDefinitionsEnum } from '../enums/graphql-definitions.enum';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

export const graphqlLoader = registerAs(ConfigEnum.GRAPHQL, (): IGrphQL => {
  return {
    playground: false,
    autoSchemaFile: join(process.cwd(), 'graphql', 'schema.gql'),
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
    sortSchema: true,
    definitions: {
      path: join(process.cwd(), 'graphql', 'graphql.ts'),
      outputAs: GraphQLDefinitionsEnum.CLASS,
    },
    graphiql: false,
  };
});
