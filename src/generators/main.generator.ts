import path from 'node:path';
import fs from 'fs-extra';
import { ProjectConfig } from './@types/index.js';
import {
  generateAppModule,
  generateAppController,
  generateAppService,
} from './core/app-module.generator.js';
import { generateCaFolderStructure } from './custom/ca-folder.generator.js';
import { generateBaseFiles } from './custom/ca-base-files.generator.js';

export async function generateMainFile(projectPath: string) {
  const mainContent = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
`;

  await fs.writeFile(path.join(projectPath, 'src', 'main.ts'), mainContent);
}

export async function generateBasicStructure(
  projectPath: string,
  config: ProjectConfig,
) {
  // Criar estrutura de diretórios
  const dirs = ['src', 'src/common', 'src/config', 'test'];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Gerar arquivos básicos
  await generateMainFile(projectPath);
  await generateAppModule(projectPath, config);
  await generateAppController(projectPath);
  await generateAppService(projectPath);

  // Generate CA folder structure
  await generateCaFolderStructure(projectPath);
  await generateBaseFiles(projectPath);
}
