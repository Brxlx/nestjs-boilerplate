/**
 * Interface robusta para tipagem do package.json
 * Extende a estrutura padrão do NPM com propriedades opcionais
 */
export interface PackageJson {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly main?: string;
  readonly scripts?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly keywords?: string[];
  readonly author?: string | { name: string; email?: string; url?: string };
  readonly license?: string;
  readonly homepage?: string;
  readonly repository?: {
    type: string;
    url: string;
  };
  readonly bugs?: {
    url: string;
    email?: string;
  };
  // Permite propriedades adicionais não tipadas
  readonly [key: string]: unknown;
}
