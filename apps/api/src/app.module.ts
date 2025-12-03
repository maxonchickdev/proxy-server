import { CoreModule } from '@app/core';
import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [CoreModule, UserModule],
})
export class AppModule {}
