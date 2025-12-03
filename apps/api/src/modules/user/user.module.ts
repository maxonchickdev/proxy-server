import { Module } from '@nestjs/common';
import { RootResolver } from './resolvers/user.resolver';

@Module({
  providers: [RootResolver],
  exports: [RootResolver],
})
export class UserModule {}
