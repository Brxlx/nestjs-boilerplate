import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

import { ProjectConfig } from './@types/index.js';
import { generatePackageJson } from './core/package-json.generator.js';
import { generateBasicStructure } from './main.generator.js';
import { setupPrisma } from './db/prsima.generator.js';
import { setupDrizzle } from './db/drizzle.generator.js';
import { gitignoreGenerator } from './core/gitignore.generator.js';

// Transform execAsync into a promise
const execAsync = promisify(exec);

export async function createProject(config: ProjectConfig) {
  const projectPath = path.join(process.cwd(), config.projectName);

  // Criar diretório do projeto
  await fs.ensureDir(projectPath);

  // Gerar package.json
  await generatePackageJson(projectPath, config);

  // Gerar .gitignore
  await gitignoreGenerator(projectPath);

  // Gerar estrutura básica do NestJS
  await generateBasicStructure(projectPath, config);

  // Configurar ORM
  if (config.orm === 'prisma') {
    await setupPrisma(projectPath, config);
  } else {
    await setupDrizzle(projectPath, config);
  }

  // Instalar dependências se solicitado
  if (config.installDependencies) {
    await execAsync('npm install', { cwd: projectPath });
  }
}
