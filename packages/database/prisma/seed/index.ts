const SEED_NOT_CONFIGURED_ERROR =
  'Seed orchestrator is not configured: add seed modules before running it.';

export async function runSeed(): Promise<never> {
  throw new Error(SEED_NOT_CONFIGURED_ERROR);
}

if (require.main === module) {
  void runSeed().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
