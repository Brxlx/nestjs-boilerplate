import path from 'node:path';
import fs from 'fs-extra';
import { ProjectConfig } from '../@types/index.js';

export async function generateAppModule(
  projectPath: string,
  config: ProjectConfig,
): Promise<void> {
  console.log('Generating AppModule...', config);
  const imports: string[] = ['Module'];
  const moduleImports: string[] = [];

  const appModuleContent: string = `import { ${imports.join(', ')} } from '@nestjs/common';
    import { AppController } from './app.controller';
    import { AppService } from './app.service';

    @Module({
      imports: [${moduleImports.join(', ')}],
      controllers: [AppController],
      providers: [AppService],
    })
    export class AppModule {}
    `;

  await fs.writeFile(
    path.join(projectPath, 'src', 'app.module.ts'),
    appModuleContent,
  );
}

export async function generateAppController(projectPath: string) {
  const controllerContent = `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
`;

  await fs.writeFile(
    path.join(projectPath, 'src', 'app.controller.ts'),
    controllerContent,
  );
}

export async function generateAppService(projectPath: string) {
  const serviceContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
`;

  await fs.writeFile(
    path.join(projectPath, 'src', 'app.service.ts'),
    serviceContent,
  );
}
