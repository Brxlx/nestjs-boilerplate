import path from 'node:path';
import fs from 'fs-extra';

import { ProjectConfig, DrizzleImportConfig } from '../@types/index.js';
import { getDrizzleImportConfig } from './drizzle.generator.js';

export async function generateDatabaseModule(
  projectPath: string,
): Promise<void> {
  const moduleContent: string = `import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
`;

  await fs.writeFile(
    path.join(projectPath, 'src', 'database', 'database.module.ts'),
    moduleContent,
  );
}

export async function generateDatabaseService(
  projectPath: string,
  config: ProjectConfig,
): Promise<void> {
  const importConfig: DrizzleImportConfig = getDrizzleImportConfig(
    config.database,
  );

  const serviceContent: string = `import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
${importConfig.imports}
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit {
  public db: ReturnType<typeof drizzle>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const databaseUrl: string = this.configService.get<string>('DATABASE_URL') || '';
    ${importConfig.connection}
    this.db = drizzle(connection, { schema });
  }
}
`;

  await fs.writeFile(
    path.join(projectPath, 'src', 'database', 'database.service.ts'),
    serviceContent,
  );
}
