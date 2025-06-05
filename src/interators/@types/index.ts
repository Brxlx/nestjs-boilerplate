// Tipos para as opções disponíveis
export type OrmType = 'prisma' | 'drizzle';
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite';
export type FeatureType =
  | 'auth'
  | 'email'
  | 'upload'
  | 'swagger'
  | 'testing'
  | 'docker'
  | 'redis';

// Interface para as respostas do inquirer
export interface ProjectAnswers {
  projectName: string;
  description: string;
  orm: OrmType;
  database: DatabaseType;
  features: FeatureType[];
  installDependencies: boolean;
}
