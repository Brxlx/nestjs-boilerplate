import path from 'node:path';
import fs from 'fs-extra';

import { ProjectConfig, PackageJson, DatabaseConfig } from '../@types/index.js';
import { getDatabaseConfig } from './utils.js';

export async function setupPrisma(
  projectPath: string,
  config: ProjectConfig,
): Promise<void> {
  console.log('Configurando Prisma...');

  // Adicionar dependências do Prisma ao package.json
  const packageJsonPath: string = path.join(projectPath, 'package.json');
  const packageJson: PackageJson = (await fs.readJson(
    packageJsonPath,
  )) as PackageJson;

  packageJson.dependencies['@prisma/client'] = '^5.6.0';
  packageJson.devDependencies['prisma'] = '^5.6.0';

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Criar diretório prisma
  await fs.ensureDir(path.join(projectPath, 'prisma'));

  // Gerar schema.prisma
  const databaseConfig: DatabaseConfig = getDatabaseConfig(config.database);

  const schemaContent: string = `// This is your Prisma schema file,
    // learn more about it in the docs: https://pris.ly/d/prisma-schema

    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "${databaseConfig.provider}"
      url      = env("DATABASE_URL")
    }

    model User {
      id        Int      @id @default(autoincrement())
      email     String   @unique
      name      String?
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt

      @@map("users")
    }
  `;

  await fs.writeFile(
    path.join(projectPath, 'prisma', 'schema.prisma'),
    schemaContent,
  );

  // Gerar arquivo .env
  const envContent: string = `# Database
    DATABASE_URL="${databaseConfig.url}"

    # Application
    PORT=3000
    NODE_ENV=development
  `;

  await fs.writeFile(path.join(projectPath, '.env'), envContent);

  // Gerar arquivo .env.example
  const envExampleContent: string = `# Database
    DATABASE_URL="${databaseConfig.url}"

    # Application
    PORT=3000
    NODE_ENV=development
  `;

  await fs.writeFile(path.join(projectPath, '.env.example'), envExampleContent);

  // Gerar módulo Prisma
  await generatePrismaModule(projectPath);

  // Gerar serviço Prisma
  await generatePrismaService(projectPath);

  // Atualizar AppModule para incluir PrismaModule
  await updateAppModuleForPrisma(projectPath);
}

async function generatePrismaModule(projectPath: string) {
  const moduleContent = `import { Global, Module } from '@nestjs/common';
    import { PrismaService } from './prisma.service';

    @Global()
    @Module({
      providers: [PrismaService],
      exports: [PrismaService],
    })
    export class PrismaModule {}
  `;

  await fs.writeFile(
    path.join(projectPath, 'src', 'prisma.module.ts'),
    moduleContent,
  );
}

async function generatePrismaService(projectPath: string) {
  const serviceContent = `import { Injectable, OnModuleInit } from '@nestjs/common';
    import { PrismaClient } from '@prisma/client';

    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit {
      async onModuleInit() {
        await this.$connect();
      }

      async onModuleDestroy() {
        await this.$disconnect();
      }
    }
  `;

  await fs.writeFile(
    path.join(projectPath, 'src', 'prisma.service.ts'),
    serviceContent,
  );
}

async function updateAppModuleForPrisma(projectPath: string): Promise<void> {
  const appModuleContent: string = `import { Module } from '@nestjs/common';
    import { ConfigModule } from '@nestjs/config';
    import { AppController } from './app.controller';
    import { AppService } from './app.service';
    import { PrismaModule } from './prisma.module';

    @Module({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
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
