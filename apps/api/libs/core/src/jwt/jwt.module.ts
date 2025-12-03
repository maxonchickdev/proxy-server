import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule as CoreJwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@app/common';

@Module({
  imports: [
    PassportModule,
    CoreJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>(`${ConfigEnum.JWT}.jwtSecret`),
        signOptions: {
          expiresIn: configService.get<number>(
            `${ConfigEnum.JWT}.jwtAccessTtl`,
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class JwtModule {}
