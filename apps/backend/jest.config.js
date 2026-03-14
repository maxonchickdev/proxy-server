"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s', '!**/*.spec.(t|j)s', '!main.ts'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};
//# sourceMappingURL=jest.config.js.map