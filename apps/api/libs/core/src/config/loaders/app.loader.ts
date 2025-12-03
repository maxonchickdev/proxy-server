import { ConfigEnum } from '@app/common';
import { registerAs } from '@nestjs/config';
import { IApp } from '../interfaces/app.interface';

export const appLoader = registerAs(ConfigEnum.APP, (): IApp => {
  return {
    appPort: Number(process.env.APP_PORT),
    appRequestTimeout: Number(process.env.APP_REQUEST_TIMEOUT),
    appName: 'Proxy server api',
    appDescription: 'Proxy server api description',
    appLogLevel: String(process.env.APP_LOG_LEVEL),
  };
});
