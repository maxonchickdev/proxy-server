import { type UserConfig, RuleConfigSeverity } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      ['ci', 'docs', 'feat', 'fix', 'refactor'],
    ],
    'type-case': [RuleConfigSeverity.Error, 'always', 'lower-case'],
    'type-empty': [RuleConfigSeverity.Error, 'never'],
    'type-max-length': [RuleConfigSeverity.Error, 'always', 10],
    'type-min-length': [RuleConfigSeverity.Error, 'always', 3],

    'scope-enum': [
      RuleConfigSeverity.Error,
      'always',
      ['root', 'backend', 'web', 'libs'],
    ],
    'scope-empty': [RuleConfigSeverity.Error, 'never'],
    'scope-max-length': [RuleConfigSeverity.Error, 'always', 20],
    'scope-min-length': [RuleConfigSeverity.Error, 'always', 2],

    'subject-case': [RuleConfigSeverity.Error, 'always', ['lower-case']],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
    'subject-full-stop': [RuleConfigSeverity.Error, 'never', '.'],
    'subject-max-length': [RuleConfigSeverity.Error, 'always', 50],
    'subject-min-length': [RuleConfigSeverity.Error, 'always', 5],

    'references-empty': [RuleConfigSeverity.Disabled, 'always'],
  },
  defaultIgnores: true,
  helpUrl:
    'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};

export default config;
