import { baseConfig } from '@repo/eslint-config/base';
import { webConfig } from '@repo/eslint-config/web'
import { defineConfig } from 'eslint/config';

export default defineConfig([...webConfig, ...baseConfig]);
