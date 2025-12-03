import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLDefinitionsEnum } from '../enums/graphql-definitions.enum';
import { NestModule } from '@nestjs/common';

export interface IGrphQL {
  playground: boolean;
  autoSchemaFile: string;
  plugins: [ApolloServerPlugin];
  sortSchema: boolean;
  definitions: {
    path: string;
    outputAs: GraphQLDefinitionsEnum;
  };
  graphiql: boolean;
}
