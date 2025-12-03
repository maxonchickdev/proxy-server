import { join } from 'node:path';
import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';

config({ path: join(process.cwd(), '.env') });

export default defineConfig({
  schema: join('prisma', 'schema.prisma'),
  migrations: {
    path: join('prisma', 'migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
