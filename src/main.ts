#!/usr/bin/env node

import { CliApplication } from './common/Main.js';

async function main(): Promise<void> {
  const app = new CliApplication();
  await app.initialize();
}

main().catch((error) => {
  console.error('💥 Erro não capturado:', error);
  process.exit(1);
});
