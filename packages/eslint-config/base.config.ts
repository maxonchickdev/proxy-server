import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export const baseConfig = [
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			eslintConfigPrettier,
			eslintPluginPrettierRecommended
		]
	}
]
