/** @type {import("jest").Config} */
module.exports = {
	moduleFileExtensions: ["js", "json", "ts"],
	rootDir: ".",
	testRegex: ".*\\.spec\\.ts$",
	transform: {
		"^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
	},
	moduleNameMapper: {
		"^src/(.*)$": "<rootDir>/src/$1",
		"^@prisma/generated/client$": "<rootDir>/prisma/generated/client",
	},
	testEnvironment: "node",
	transformIgnorePatterns: ["/node_modules/(?!nanoid)/"],
};
