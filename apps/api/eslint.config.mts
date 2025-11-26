import { defineConfig } from 'eslint/config';
import { apiConfig } from '@repo/eslint-config/api'
import { baseConfig } from '@repo/eslint-config/base'

export default defineConfig([...apiConfig, ...baseConfig]);
