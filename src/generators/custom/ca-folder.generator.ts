import { join } from 'node:path';
import fs from 'fs-extra';

export async function generateCaFolderStructure(projectPath: string) {
  const folderStructure = {
    'src/core': ['@types', 'entities', 'repositories', 'consts', 'errors'],
    'src/domain': ['application', 'enterprise'],
    'src/domain/application': [
      'gateways',
      'use-cases',
      'value-objects',
      'events',
    ],
    'src/domain/enterprise': ['entities'],
    'src/infra': [
      'database',
      'setup',
      'http',
      'env',
      'filters',
      'pipes',
      'gateways',
      'decorators',
    ],
  };

  // Cria diretórios base primeiro
  for (const baseDir of Object.keys(folderStructure)) {
    await fs.ensureDir(join(projectPath, baseDir));
  }

  // Depois cria os subdiretórios
  for (const [baseDir, subDirs] of Object.entries(folderStructure)) {
    for (const subDir of subDirs) {
      await fs.ensureDir(join(projectPath, baseDir, subDir));
    }
  }
}
