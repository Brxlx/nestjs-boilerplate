export interface ProjectConfig {
  projectName: string;
  description: string;
  orm: 'prisma' | 'drizzle';
  database: 'postgresql' | 'mysql' | 'sqlite';
  features: string[];
  installDependencies: boolean;
}

export interface PackageJsonDependencies {
  [key: string]: string;
}

export interface PackageJsonScripts {
  [key: string]: string;
}

export interface PackageJson {
  name: string;
  version: string;
  description: string;
  author: string;
  private: boolean;
  license: string;
  scripts: PackageJsonScripts;
  dependencies: PackageJsonDependencies;
  devDependencies: PackageJsonDependencies;
}

export interface DatabaseConfig {
  provider: string;
  url: string;
  driver: string;
  credentials: string;
}

export interface DrizzleImportConfig {
  imports: string;
  connection: string;
}
