import inquirer from 'inquirer';

import { ProjectAnswers } from './@types/index.js';
import chalk from 'chalk';
import ora from 'ora';
import { createProject } from 'src/generators/project-generator.js';
// Função principal para coletar informações do projeto
export async function promptProjectDetails(): Promise<ProjectAnswers> {
  const answers = await inquirer.prompt<ProjectAnswers>([
    {
      type: 'input',
      name: 'projectName',
      message: 'Qual o nome do seu projeto?',
      default: 'my-nestjs-app',
      validate: (input: string) => {
        if (input.trim().length === 0) {
          return 'Nome do projeto é obrigatório!';
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
          return 'Nome do projeto deve conter apenas letras, números, hífens e underscores!';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Descrição do projeto:',
      default: 'A NestJS application',
    },
    {
      type: 'list',
      name: 'orm',
      message: 'Qual ORM você deseja utilizar?',
      choices: [
        {
          name: '🔷 Prisma - ORM moderno com type-safety',
          value: 'prisma' as const,
        },
        {
          name: '🟢 Drizzle - ORM leve e performático',
          value: 'drizzle' as const,
        },
      ],
    },
    {
      type: 'list',
      name: 'database',
      message: 'Qual banco de dados?',
      choices: [
        { name: '🐘 PostgreSQL', value: 'postgresql' as const },
        { name: '🐬 MySQL', value: 'mysql' as const },
        { name: '📄 SQLite', value: 'sqlite' as const },
      ],
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Selecione as funcionalidades que deseja incluir:',
      choices: [
        { name: '🔐 Autenticação JWT', value: 'auth' as const },
        { name: '📧 Sistema de Email', value: 'email' as const },
        { name: '📁 Upload de Arquivos', value: 'upload' as const },
        { name: '📊 Swagger/OpenAPI', value: 'swagger' as const },
        { name: '🧪 Testes (Jest)', value: 'testing' as const },
        { name: '🐳 Docker', value: 'docker' as const },
        { name: '🔄 Redis Cache', value: 'redis' as const },
      ],
    },
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Instalar dependências automaticamente?',
      default: true,
    },
  ]);

  return answers;
}

export async function projectConfig(projectConfig: ProjectAnswers) {
  try {
    console.log(chalk.green('\n✨ Configuração do projeto:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(`📦 Nome: ${chalk.cyan(projectConfig.projectName)}`);
    console.log(`📝 Descrição: ${chalk.cyan(projectConfig.description)}`);
    console.log(`🗄️  ORM: ${chalk.cyan(projectConfig.orm.toUpperCase())}`);
    console.log(
      `💾 Banco: ${chalk.cyan(projectConfig.database.toUpperCase())}`,
    );
    console.log(
      `🔧 Features: ${chalk.cyan(projectConfig.features.join(', ') || 'Nenhuma')}`,
    );
    console.log(chalk.gray('─'.repeat(40)));

    const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Confirma a criação do projeto com essas configurações?',
        default: true,
      },
    ]);

    if (confirm) {
      const spinner = ora('Gerando projeto...').start();

      try {
        await createProject(projectConfig);
        spinner.succeed(chalk.green('Projeto criado com sucesso! 🎉'));

        console.log(chalk.yellow('\n📋 Próximos passos:'));
        console.log(chalk.gray(`  cd ${projectConfig.projectName}`));
        if (!projectConfig.installDependencies) {
          console.log(chalk.gray('  npm install'));
        }
        console.log(chalk.gray('  npm run start:dev'));
        console.log(chalk.green('\n🚀 Happy coding!\n'));
        process.exit(0);
      } catch (error) {
        spinner.fail('Erro ao gerar projeto');
        console.error(chalk.red(error));
        process.exit(1);
      }
    } else {
      console.log(chalk.yellow('Operação cancelada.'));
      process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red('Erro:', error));
    process.exit(1);
  }
}
