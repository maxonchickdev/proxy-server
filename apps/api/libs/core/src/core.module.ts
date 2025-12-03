import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { GraphQLModule } from './graphql/graphql.module';
import { JwtModule } from './jwt/jwt.module';

@Module({
  imports: [PrismaModule, ConfigModule, GraphQLModule, JwtModule],
  exports: [PrismaModule, ConfigModule, GraphQLModule, JwtModule],
})
export class CoreModule {}
