import {
  DatabaseConfig,
  PackageJsonDependencies,
  ProjectConfig,
} from '../@types/index.js';

/// Funções utilitárias tipadas
export function getDatabaseConfig(
  database: ProjectConfig['database'],
): DatabaseConfig {
  const configs: Record<ProjectConfig['database'], DatabaseConfig> = {
    postgresql: {
      provider: 'postgresql',
      url: 'postgresql://username:password@localhost:5432/database_name',
      driver: 'pg',
      credentials: 'connectionString: process.env.DATABASE_URL!',
    },
    mysql: {
      provider: 'mysql',
      url: 'mysql://username:password@localhost:3306/database_name',
      driver: 'mysql2',
      credentials: 'connectionString: process.env.DATABASE_URL!',
    },
    sqlite: {
      provider: 'sqlite',
      url: 'file:./dev.db',
      driver: 'better-sqlite3',
      credentials: 'url: process.env.DATABASE_URL!',
    },
  };

  return configs[database];
}

export function getDatabaseDependencies(database: ProjectConfig['database']): {
  dependencies: PackageJsonDependencies;
  devDependencies: PackageJsonDependencies;
} {
  const dependencyConfigs: Record<
    ProjectConfig['database'],
    {
      dependencies: PackageJsonDependencies;
      devDependencies: PackageJsonDependencies;
    }
  > = {
    postgresql: {
      dependencies: { pg: '^8.11.3' },
      devDependencies: { '@types/pg': '^8.10.9' },
    },
    mysql: {
      dependencies: { mysql2: '^3.6.5' },
      devDependencies: {},
    },
    sqlite: {
      dependencies: { 'better-sqlite3': '^9.2.2' },
      devDependencies: { '@types/better-sqlite3': '^7.6.8' },
    },
  };

  return dependencyConfigs[database];
}
