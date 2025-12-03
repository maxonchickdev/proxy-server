import { ConfigEnum } from '@app/common';
import { registerAs } from '@nestjs/config';
import { INodeEnv } from '../interfaces/node-env.interface';

export const nodeEnvLoader = registerAs(ConfigEnum.NODE_ENV, (): INodeEnv => {
  return {
    nodeEnv: String(process.env.NODE_ENV),
  };
});
