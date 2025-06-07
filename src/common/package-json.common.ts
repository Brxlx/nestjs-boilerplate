import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PackageJson } from './@types/index.js';

/**
 * Classe utilitária para gerenciamento de package.json
 * Implementa padrão Singleton para cache de dados
 */
export class PackageJsonManager {
  private static instance: PackageJsonManager;
  private packageData: PackageJson | null = null;
  private readonly projectRoot: string;

  private constructor() {
    // Determina o diretório raiz do projeto
    this.projectRoot = this.getProjectRoot();
  }

  /**
   * Implementação do padrão Singleton
   */
  public static getInstance(): PackageJsonManager {
    if (!PackageJsonManager.instance) {
      PackageJsonManager.instance = new PackageJsonManager();
    }
    return PackageJsonManager.instance;
  }

  /**
   * Determina o diretório raiz do projeto de forma compatível com ES Modules
   */
  private getProjectRoot(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return join(__dirname, '..');
  }

  /**
   * Método principal para obter dados do package.json
   * Utiliza cache para evitar múltiplas leituras
   */
  public async getPackageData(): Promise<PackageJson> {
    if (this.packageData) {
      return this.packageData;
    }

    this.packageData = await this.loadPackageJson();
    return this.packageData;
  }

  /**
   * Carrega o package.json usando diferentes estratégias
   * Fallback para diferentes ambientes e configurações
   */
  private async loadPackageJson(): Promise<PackageJson> {
    const strategies = [
      () => this.loadWithRequire(),
      () => this.loadWithFileSystem(),
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (this.validatePackageJson(result)) {
          return result;
        }
      } catch (error: any) {
        // Continua para próxima estratégia
        console.debug(`Estratégia de carregamento falhou: ${error}`);
      }
    }

    throw new Error(
      'Não foi possível carregar package.json com nenhuma estratégia disponível',
    );
  }

  /**
   * Estratégia 2: Uso do require em contexto ES Module
   */
  private async loadWithRequire(): Promise<PackageJson> {
    const require = createRequire(import.meta.url);
    const packageJsonPath = join(
      this.projectRoot,
      '../package.json' /*src não existe na build, volta apenas um diretório acima */,
    );

    return Promise.resolve(require(packageJsonPath) as PackageJson);
  }

  /**
   * Estratégia 3: Leitura direta do sistema de arquivos (fallback)
   */
  private async loadWithFileSystem(): Promise<PackageJson> {
    const { readFile } = await import('node:fs/promises');
    const packageJsonPath = join(
      this.projectRoot,
      '../package.json' /*src não existe na build, volta apenas um diretório acima */,
    );

    const content = await readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content) as PackageJson;
  }

  /**
   * Validação robusta da estrutura do package.json
   * Implementa type guard com verificações detalhadas
   */
  private validatePackageJson(obj: unknown): obj is PackageJson {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const pkg = obj as Record<string, unknown>;

    // Validações obrigatórias
    if (typeof pkg.name !== 'string' || !pkg.name.trim()) {
      throw new Error('package.json deve conter um nome válido');
    }

    if (typeof pkg.version !== 'string' || !this.isValidVersion(pkg.version)) {
      throw new Error('package.json deve conter uma versão válida (semver)');
    }

    return true;
  }

  /**
   * Validação de versão usando padrão semver
   */
  private isValidVersion(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[\w\d\-_.+]*)?$/;
    return semverRegex.test(version);
  }

  /**
   * Método utilitário para obter apenas a versão
   */
  public async getVersion(): Promise<string> {
    const packageData = await this.getPackageData();
    return packageData.version;
  }

  /**
   * Método utilitário para obter informações básicas
   */
  public async getBasicInfo(): Promise<{
    name: string;
    version: string;
    description?: string;
  }> {
    const packageData = await this.getPackageData();
    return {
      name: packageData.name,
      version: packageData.version,
      description: packageData.description,
    };
  }
}
