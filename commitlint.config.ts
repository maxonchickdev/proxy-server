import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";

const config: UserConfig = {
  defaultIgnores: true,
  extends: ["@commitlint/config-conventional"],
  helpUrl:
    "https://github.com/conventional-changelog/commitlint/#what-is-commitlint",
  rules: {
    "body-case": [RuleConfigSeverity.Error, "always", "sentencecase"],
    "body-empty": [RuleConfigSeverity.Error, "always"],
    "body-full-stop": [RuleConfigSeverity.Error, "always", "."],
    "body-leading-blank": [RuleConfigSeverity.Disabled, "never"],
    "body-max-length": [RuleConfigSeverity.Error, "always", Infinity],
    "body-max-line-length": [RuleConfigSeverity.Error, "always", Infinity],
    "body-min-length": [RuleConfigSeverity.Error, "always", 0],

    "header-case": [RuleConfigSeverity.Error, "always", "lowercase"],
    "header-full-stop": [RuleConfigSeverity.Disabled, "never", "."],
    "header-max-length": [RuleConfigSeverity.Error, "always", Infinity],
    "header-min-length": [RuleConfigSeverity.Error, "always", 0],
    "header-trim": [RuleConfigSeverity.Error, "always"],

    "references-empty": [RuleConfigSeverity.Disabled, "always"],

    "scope-case": [RuleConfigSeverity.Error, "always", "lowercase"],
    "scope-empty": [RuleConfigSeverity.Error, "never"],
    "scope-enum": [
      RuleConfigSeverity.Error,
      "always",
      ["root", "backend", "web", "shared"],
    ],
    "scope-max-length": [RuleConfigSeverity.Error, "always", Infinity],
    "scope-min-length": [RuleConfigSeverity.Error, "always", 0],

    "subject-case": [RuleConfigSeverity.Error, "always", ["lowercase"]],
    "subject-empty": [RuleConfigSeverity.Error, "never"],
    "subject-full-stop": [RuleConfigSeverity.Disabled, "never", "."],
    "subject-max-length": [RuleConfigSeverity.Error, "always", Infinity],
    "subject-min-length": [RuleConfigSeverity.Error, "always", 0],

    "type-case": [RuleConfigSeverity.Error, "always", "lowercase"],
    "type-empty": [RuleConfigSeverity.Error, "never"],
    "type-enum": [
      RuleConfigSeverity.Error,
      "always",
      ["chore", "ci", "docs", "feat", "fix", "refactor", "test"],
    ],
    "type-max-length": [RuleConfigSeverity.Error, "always", Infinity],
    "type-min-length": [RuleConfigSeverity.Error, "always", 0],
  },
};

export default config;
