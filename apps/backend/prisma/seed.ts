/**
 * Database seed entry: extend when you need default data in development.
 */
const main = async (): Promise<void> => {
  console.log("Seed finished: no default records configured.");
};

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
