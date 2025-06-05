import path from 'node:path';
import fs from 'fs-extra';

export async function gitignoreGenerator(projectPath: string) {
  const gitignore = 'node_modules\ndist\n.env';
  console.log('Creating .gitignore at:', path.join(projectPath, '.gitignore'));

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
}
