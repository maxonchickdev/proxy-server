import { ConfigEnum } from '@app/common';
import { registerAs } from '@nestjs/config';
import { IJwt } from '../interfaces/jwt.interface';

export const jwtLoader = registerAs(ConfigEnum.JWT, (): IJwt => {
  return {
    jwtSecret: String(process.env.JWT_SECRET),
    jwtAccessTtl: Number(process.env.JWT_ACCESS_TTL),
    jwtRefreshTtl: Number(process.env.JWT_REFRESH_TTL),
  };
});
