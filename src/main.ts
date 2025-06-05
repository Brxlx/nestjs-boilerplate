#!/usr/bin/env node

import { Command } from 'commander';
import { showWelcomeBanner } from './interators/welcome-banner.interator.js';
import {
  projectConfig,
  promptProjectDetails,
} from './interators/prompt-project-details.interator.js';

const program = new Command();

// Comando principal
program
  .name('nestjs-boilerplate')
  .description('CLI para gerar boilerplate de projetos NestJS')
  .version('1.0.0');

program
  .command('create')
  .description('Criar um novo projeto NestJS')
  .action(async () => {
    showWelcomeBanner();

    try {
      const projectConfigDetails = await promptProjectDetails();
      await projectConfig(projectConfigDetails);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.isTtyError) {
        console.error("Prompt couldn't be rendered in the current environment");
        process.exit(1);
      }
      // console.log(error);
      process.exit(1);
    }
  });

program.parse();
