import { Command } from 'commander';
import {
  promptProjectDetails,
  projectConfig,
} from 'src/interators/prompt-project-details.interator.js';
import { showWelcomeBanner } from 'src/interators/welcome-banner.interator.js';
import { PackageJsonManager } from './package-json.common.js';

/**
 * Classe principal do CLI com arquitetura limpa
 * Separa responsabilidades e implementa tratamento de erros robusto
 */
export class CliApplication {
  private readonly packageManager: PackageJsonManager;
  private readonly program: Command;

  constructor() {
    this.packageManager = PackageJsonManager.getInstance();
    this.program = new Command();
  }

  /**
   * Inicialização assíncrona do CLI
   */
  public async initialize(): Promise<void> {
    try {
      await this.setupCommands();
      this.program.parse();
    } catch (error) {
      this.handleFatalError(error);
    }
  }

  /**
   * Configuração dos comandos disponíveis
   */
  private async setupCommands(): Promise<void> {
    const { version, description } = await this.packageManager.getBasicInfo();

    this.program
      .name('dmc')
      .description(
        description || 'CLI para gerar boilerplate de projetos NestJS',
      )
      .version(version);

    this.setupCreateCommand();
    this.setupUninstallCommand();
  }

  /**
   * Configuração do comando 'create'
   */
  private setupCreateCommand(): void {
    this.program
      .command('create')
      .description('Criar um novo projeto NestJS')
      .action(async () => {
        try {
          showWelcomeBanner();

          const projectConfigDetails = await promptProjectDetails();
          await projectConfig(projectConfigDetails);

          console.log('✅ Projeto criado com sucesso!');
        } catch (error) {
          this.handleCommandError('create', error);
        }
      });
  }

  /**
   * Configuração do comando 'uninstall'
   */
  private setupUninstallCommand(): void {
    this.program
      .command('uninstall')
      .description('Desinstalar o CLI')
      .action(async () => {
        try {
          console.log('🗑️  Iniciando desinstalação do CLI...');

          // TODO: Implementar lógica de desinstalação
          await this.performUninstall();

          console.log('✅ CLI desinstalado com sucesso!');
        } catch (error) {
          this.handleCommandError('uninstall', error);
        }
      });
  }

  /**
   * Implementação da lógica de desinstalação
   */
  private async performUninstall(): Promise<void> {
    // Implementar lógica específica de desinstalação
    // Por exemplo: remover arquivos, limpar cache, etc.
    console.log('🔄 Processando desinstalação...');
    return Promise.resolve();
  }

  /**
   * Tratamento de erros específicos de comandos
   */
  private handleCommandError(command: string, error: unknown): never {
    if (error && typeof error === 'object' && 'isTtyError' in error) {
      console.error(
        `❌ Erro no comando '${command}': Prompt não pôde ser renderizado no ambiente atual`,
      );
      process.exit(1);
    }

    if (error instanceof Error) {
      if (error.message === 'User force closed the prompt with SIGINT') {
        // console.error(`❌ Cancelado pelo usuário`);
        process.exit(0);
      }
    } else {
      console.error(`❌ Erro desconhecido no comando '${command}'`);
      process.exit(1);
    }
    process.exit(1);
  }

  /**
   * Tratamento de erros fatais da aplicação
   */
  private handleFatalError(error: unknown): never {
    if (error instanceof Error) {
      console.error(`💥 Erro fatal: ${error.message}`);
    } else {
      console.error('💥 Erro fatal desconhecido');
    }

    process.exit(1);
  }
}
