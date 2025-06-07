import path from 'node:path';
import fs from 'fs-extra';

import {
  ProjectConfig,
  PackageJson,
  DatabaseConfig,
  DrizzleImportConfig,
} from '../@types/index.js';
import { getDatabaseDependencies, getDatabaseConfig } from './utils.js';
import {
  generateDatabaseModule,
  generateDatabaseService,
} from './db.generator.js';

export async function setupDrizzle(
  projectPath: string,
  config: ProjectConfig,
): Promise<void> {
  console.log('Configurando Drizzle...');

  // Adicionar dependências do Drizzle ao package.json
  const packageJsonPath: string = path.join(projectPath, 'package.json');
  const packageJson: PackageJson = (await fs.readJson(
    packageJsonPath,
  )) as PackageJson;

  packageJson.dependencies['drizzle-orm'] = '^0.29.0';
  packageJson.devDependencies['drizzle-kit'] = '^0.20.4';

  // Adicionar driver específico do banco
  const databaseDependencies = getDatabaseDependencies(config.database);
  Object.assign(packageJson.dependencies, databaseDependencies.dependencies);
  Object.assign(
    packageJson.devDependencies,
    databaseDependencies.devDependencies,
  );

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Criar diretório src/database
  await fs.ensureDir(path.join(projectPath, 'src', 'database'));

  // Gerar configuração do Drizzle
  await generateDrizzleConfig(projectPath, config);

  // Gerar schema do banco
  await generateDrizzleSchema(projectPath, config);

  // Gerar módulo Database
  await generateDatabaseModule(projectPath);

  // Gerar serviço Database
  await generateDatabaseService(projectPath, config);

  // Gerar arquivo .env
  const databaseConfig: DatabaseConfig = getDatabaseConfig(config.database);
  const envContent: string = `# Database
DATABASE_URL="${databaseConfig.url}"

# Application
PORT=3000
NODE_ENV=development
`;

  await fs.writeFile(path.join(projectPath, '.env'), envContent);

  // Gerar arquivo .env.example
  await fs.writeFile(path.join(projectPath, '.env.example'), envContent);

  // Atualizar AppModule para incluir DatabaseModule
  await updateAppModuleForDrizzle(projectPath);
}

// Funções auxiliares para Drizzle
async function generateDrizzleConfig(
  projectPath: string,
  config: ProjectConfig,
): Promise<void> {
  const databaseConfig: DatabaseConfig = getDatabaseConfig(config.database);

  const configContent: string = `import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  driver: '${databaseConfig.driver}',
  dbCredentials: {
    ${databaseConfig.credentials}
  },
} satisfies Config;
`;

  await fs.writeFile(
    path.join(projectPath, 'drizzle.config.ts'),
    configContent,
  );
}

async function generateDrizzleSchema(
  projectPath: string,
  config: ProjectConfig,
): Promise<void> {
  const schemaContent: string = getDrizzleSchemaContent(config.database);
  await fs.writeFile(
    path.join(projectPath, 'src', 'database', 'schema.ts'),
    schemaContent,
  );
}

async function updateAppModuleForDrizzle(projectPath: string): Promise<void> {
  const appModuleContent: string = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

  await fs.writeFile(
    path.join(projectPath, 'src', 'app.module.ts'),
    appModuleContent,
  );

  // Adicionar @nestjs/config ao package.json
  const packageJsonPath: string = path.join(projectPath, 'package.json');
  const packageJson: PackageJson = (await fs.readJson(
    packageJsonPath,
  )) as PackageJson;
  packageJson.dependencies['@nestjs/config'] = '^3.1.1';
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

export function getDrizzleImportConfig(
  database: ProjectConfig['database'],
): DrizzleImportConfig {
  const importConfigs: Record<ProjectConfig['database'], DrizzleImportConfig> =
    {
      postgresql: {
        imports: `import { drizzle } from 'drizzle-orm/node-postgres';
          import { Client } from 'pg';`,
        connection: `const connection = new Client({ connectionString: databaseUrl });
          await connection.connect();`,
      },
      mysql: {
        imports: `import { drizzle } from 'drizzle-orm/mysql2';
          import mysql from 'mysql2/promise';`,
        connection: `const connection = await mysql.createConnection(databaseUrl);`,
      },
      sqlite: {
        imports: `import { drizzle } from 'drizzle-orm/better-sqlite3';
          import Database from 'better-sqlite3';`,
        connection: `const connection = new Database(databaseUrl.replace('file:', ''));`,
      },
    };

  return importConfigs[database];
}
function getDrizzleSchemaContent(database: ProjectConfig['database']): string {
  const schemaConfigs: Record<ProjectConfig['database'], string> = {
    postgresql: `import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`,
    mysql: `import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`,
    sqlite: `import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`,
  };

  return schemaConfigs[database];
}
