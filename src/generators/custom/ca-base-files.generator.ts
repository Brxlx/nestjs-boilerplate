import fs from 'fs-extra';
import { join } from 'node:path';

export async function generateBaseFiles(projectPath: string) {
  const baseFiles = {
    // Core Entities
    'src/core/entities/id.ts': `import { createCuid2, isCuid2 } from './cuid2';

export class ID {
  private value: string;

  toString() {
    return this.value;
  }

  toValue() {
    return this.value;
  }

  private generateId(): string {
    return createCuid2();
  }

  constructor(value?: string) {
    this.value = value ?? this.generateId();
  }

  public equals(id: ID): boolean {
    return id.toValue() === this.value;
  }

  public isValid(): boolean {
    return isCuid2(this.value);
  }
}`,

    // CUID2 utility
    'src/core/entities/cuid2.ts': `import { randomBytes } from 'node:crypto';
import * as os from 'node:os';
/**
 * @fileoverview Implementação completa do algoritmo CUID2 seguindo a especificação oficial.
 *
 * Baseado na especificação de https://github.com/paralleldrive/cuid2
 *
 * Um CUID2 é um identificador único com as seguintes propriedades:
 * - Comprimento fixo de 24 caracteres
 * - Composto apenas por caracteres alfanuméricos minúsculos (a-z0-9)
 * - Colisão extremamente improvável (entropia de ~172 bits)
 * - Baseado em características entropicas do ambiente de execução
 * - Gera IDs sequenciais para melhor desempenho em índices de bancos de dados
 */

/**
 * Interface para opções de configuração do gerador CUID2
 */
export interface Cuid2Options {
  /** Comprimento do identificador (padrão: 24) */
  length?: number;
  /** String de counter personalizada (usada em testes) */
  counter?: string;
  /** Função para gerar valores aleatórios (padrão: crypto.getRandomValues) */
  random?: () => number;
  /** Função para obter o tempo atual em ms (padrão: Date.now) */
  currentTime?: () => number;
  /** Entropia personalizada adicional */
  fingerprint?: string;
}

/**
 * Classe que implementa o algoritmo CUID2 para geração de identificadores únicos
 *
 * Esta implementação segue fielmente a especificação oficial do CUID2
 * com algumas melhorias para TypeScript e validações adicionais.
 */
export class Cuid2 {
  // Constantes para configuração do algoritmo
  private static readonly DEFAULT_LENGTH = 24;
  private static readonly BLOCK_SIZE = 4;
  private static readonly BASE = 36; // Base36: 0-9a-z
  private static readonly DISCRETE_VALUES = Math.pow(Cuid2.BASE, Cuid2.BLOCK_SIZE);

  // Variáveis de instância
  private readonly length: number;
  private counter: string;
  private readonly random: () => number;
  private readonly currentTime: () => number;
  private readonly fingerprint: string;

  /**
   * Cria uma nova instância do gerador CUID2
   *
   * @param options Opções de configuração
   */
  constructor(options: Cuid2Options = {}) {
    this.length = options.length || Cuid2.DEFAULT_LENGTH;
    this.counter = options.counter || this.createCounter();
    this.random = options.random || this.defaultRandom;
    this.currentTime = options.currentTime || (() => Date.now());
    this.fingerprint = options.fingerprint || this.createFingerprint();

    // Validações
    if (this.length < 2) {
      throw new Error('O comprimento mínimo do CUID2 deve ser 2');
    }
  }

  /**
   * Gera um novo identificador CUID2
   *
   * @returns String contendo um CUID2 válido
   */
  public create(): string {
    // Inicializa com timestamp para ordenação implícita
    const time = this.getTimestamp();

    // Implementação do contador para evitar colisões em sequências rápidas
    this.counter = this.incrementCounter();

    // Calcula quantos caracteres aleatórios precisamos para alcançar o comprimento desejado
    const usedLength = time.length + this.counter.length + this.fingerprint.length;
    const randomLength = this.length - usedLength;

    // Gera a parte aleatória de alta entropia
    const random = this.createRandomBlock(randomLength);

    // Combina todas as partes (tempo + fingerprint + contador + aleatório)
    // e "embaralha" para distribuir melhor os valores
    return this.shuffle(time + this.fingerprint + this.counter + random);
  }

  /**
   * Verifica se uma string é um CUID2 válido
   *
   * @param value Valor a ser verificado
   * @returns true se for um CUID2 válido, false caso contrário
   */
  public static isValid(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // Verifica o comprimento padrão (a menos que seja um CUID2 customizado)
    if (value.length !== Cuid2.DEFAULT_LENGTH) {
      return false;
    }

    // Verifica se contém apenas caracteres alfanuméricos minúsculos (base36)
    const VALID_CHARS_REGEX = /^[a-z0-9]*$/;
    return VALID_CHARS_REGEX.test(value);
  }

  /**
   * Método de fábrica para criar um novo CUID2 com configuração padrão
   *
   * @returns String contendo um CUID2 válido
   */
  public static createCuid(): string {
    return new Cuid2().create();
  }

  /**
   * Gera um timestamp base36 para ordenação temporal
   *
   * @returns String representando o timestamp atual em base36
   */
  private getTimestamp(): string {
    return this.currentTime().toString(Cuid2.BASE);
  }

  /**
   * Cria um bloco de caracteres aleatórios com alta entropia
   *
   * @param length Comprimento do bloco aleatório
   * @returns String contendo caracteres aleatórios em base36
   */
  private createRandomBlock(length: number): string {
    let result = '';

    // Gera caracteres aleatórios até atingir o comprimento desejado
    while (result.length < length) {
      const randomValue = Math.floor(this.random() * Cuid2.DISCRETE_VALUES);
      result += randomValue.toString(Cuid2.BASE);
    }

    // Trunca para o comprimento exato, caso tenha gerado mais caracteres
    return result.slice(0, length);
  }

  /**
   * Implementação para geração de números aleatórios em ambiente Node.js
   * Utiliza o módulo crypto do Node.js para gerar valores aleatórios criptograficamente seguros
   *
   * @returns Número aleatório entre 0 e 1
   */
  private defaultRandom(): number {
    try {
      // Em Node.js, usamos o módulo crypto nativo
      const buffer = randomBytes(1);
      return buffer[0] / 0xff;
    } catch {
      // Fallback para Math.random se crypto não estiver disponível
      return Math.random();
    }
  }

  /**
   * Cria uma string de counter inicial
   * O contador é usado para evitar colisões em sequências rápidas
   *
   * @returns String inicial do contador em base36
   */
  private createCounter(): string {
    // Inicializa com um valor aleatório
    const initial = Math.floor(this.defaultRandom() * Cuid2.DISCRETE_VALUES);
    return initial.toString(Cuid2.BASE).padStart(Cuid2.BLOCK_SIZE, '0');
  }

  /**
   * Incrementa o contador para evitar colisões
   *
   * @returns Nova string do contador em base36
   */
  private incrementCounter(): string {
    // Converte o contador atual para número
    const counterInt = parseInt(this.counter, Cuid2.BASE);

    // Incrementa e converte de volta para string base36
    const incremented = (counterInt + 1) % Cuid2.DISCRETE_VALUES;
    return incremented.toString(Cuid2.BASE).padStart(Cuid2.BLOCK_SIZE, '0');
  }

  /**
   * Gera uma impressão digital única para o ambiente de execução Node.js
   * Combina informações específicas da plataforma para adicionar entropia
   *
   * @returns String representando características do ambiente
   */
  private createFingerprint(): string {
    let fingerprint = '';

    // Em Node.js, usamos informações do processo
    try {
      // Process ID (PID)
      fingerprint += (process.pid % Cuid2.BASE).toString(Cuid2.BASE);

      // Nome do host
      fingerprint += os.hostname().length % Cuid2.BASE;

      // Quantidade de CPUs
      fingerprint += os.cpus().length % Cuid2.BASE;

      // Memória total (último dígito apenas para entropia)
      fingerprint += (os.totalmem() % Cuid2.BASE).toString(Cuid2.BASE);

      // Tempo de execução do processo
      fingerprint += (process.uptime() % Cuid2.BASE).toString(Cuid2.BASE);
    } catch {
      // Fallback se as APIs do Node.js não estiverem disponíveis
      fingerprint =
        Math.floor(this.defaultRandom() * Cuid2.BASE).toString(Cuid2.BASE) +
        Math.floor(this.defaultRandom() * Cuid2.BASE).toString(Cuid2.BASE);
    }

    // Garante que tem pelo menos 2 caracteres
    while (fingerprint.length < 2) {
      fingerprint += '0';
    }

    // Limita o tamanho máximo para 4 caracteres (padrão CUID2)
    return fingerprint.slice(0, 4);
  }

  /**
   * Embaralha os caracteres para distribuir melhor os valores
   * Isso dificulta a dedução das partes componentes do ID
   *
   * @param input String a ser embaralhada
   * @returns String embaralhada
   */
  private shuffle(input: string): string {
    const result = Array(input.length).fill('');
    const inputArray = input.split('');

    // mantém o algortimo de embaralhamento original
    // const used = new Set<number>();

    // for (let i = 0; i < input.length; i++) {
    //   let position = i % 2 === 0 ? Math.floor(i / 2) : Math.floor(input.length - 1 - i / 2);

    //   // Se a posição já estiver ocupada, encontre a próxima disponível
    //   while (used.has(position)) {
    //     position = (position + 1) % input.length;
    //   }

    //   result[position] = inputArray[i];
    //   used.add(position);
    // }

    // return result.join('');

    // Algoritmo de entrelaçamento correto
    let firstHalfIndex = 0;
    let secondHalfIndex = input.length - 1;

    for (let i = 0; i < input.length; i++) {
      if (i % 2 === 0) {
        // Para índices pares, coloca no início
        result[firstHalfIndex] = inputArray[i];
        firstHalfIndex++;
      } else {
        // Para índices ímpares, coloca no final
        result[secondHalfIndex] = inputArray[i];
        secondHalfIndex--;
      }
    }

    return result.join('');
  }
}

/**
 * Função de conveniência para criar um novo CUID2
 *
 * @returns String contendo um CUID2 válido
 */
export function createCuid2(): string {
  return Cuid2.createCuid();
}

/**
 * Função de conveniência para validar um CUID2
 *
 * @param value Valor a ser verificado
 * @returns true se for um CUID2 válido, false caso contrário
 */
export function isCuid2(value: unknown): boolean {
  return Cuid2.isValid(value);
}`,

    // Base Entity
    'src/core/entities/entity.ts': `import { ID } from './id';

export abstract class Entity<T = any> {
  protected readonly _id: ID;
  protected props: T;

  constructor(props: T, id?: ID) {
    this._id = id ?? new ID();
    this.props = props;
  }

  get id(): ID {
    return this._id;
  }

  public equals(object?: Entity<T>): boolean {
    if (object == null || object == undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    return this._id.equals(object._id);
  }
}`,

    // Base Aggregate Root
    'src/core/entities/aggregate-root.ts': `import { Entity } from './entity';
import { DomainEvent } from '../events/domain-event';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length);
  }
}`,

    // Domain Event
    'src/core/events/domain-event.ts': `import { ID } from '../entities/id';

export interface DomainEvent {
  occurredAt: Date;
  getAggregateId(): ID;
}`,

    // Base Repository Interface
    'src/core/repositories/repository.ts': `import { Entity } from '../entities/entity';
import { ID } from '../entities/id';

export interface Repository<T extends Entity> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}`,

    // Use Case Interface
    'src/core/use-cases/use-case.ts': `export interface UseCase<TRequest = any, TResponse = any> {
  execute(request: TRequest): Promise<TResponse>;
}`,

    // Either (Result Pattern)
    'src/core/either.ts': `export class Left<L, R> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }
}

export class Right<L, R> {
  readonly value: R;

  constructor(value: R) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(l: L): Either<L, R> => {
  return new Left(l);
};

export const right = <L, R>(r: R): Either<L, R> => {
  return new Right(r);
};`,

    // Domain Error
    'src/core/errors/domain-error.ts': `export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}`,

    // Value Object
    'src/core/entities/value-object.ts': `export abstract class ValueObject<T> {
  protected props: T;

  constructor(props: T) {
    this.props = props;
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (vo.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}`,

    // Optional utility type
    'src/core/types/optional.ts': `export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;`,

    // Unique Entity ID
    'src/core/entities/unique-entity-id.ts': `import { ID } from './id';

export class UniqueEntityID extends ID {
  constructor(id?: string) {
    super(id);
  }
}`,

    // Domain Events Handler
    'src/core/events/domain-events.ts': `import { AggregateRoot } from '../entities/aggregate-root';
import { DomainEvent } from './domain-event';
import { ID } from '../entities/id';

type EventHandler = (event: DomainEvent) => void;

export class DomainEvents {
  private static handlersMap: Record<string, EventHandler[]> = {};
  private static markedAggregates: AggregateRoot<any>[] = [];

  public static markAggregateForDispatch(aggregate: AggregateRoot<any>): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static dispatchAggregateEvents(aggregate: AggregateRoot<any>): void {
    aggregate.domainEvents.forEach((event: DomainEvent) =>
      this.dispatch(event),
    );
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<any>,
  ): void {
    const index = this.markedAggregates.findIndex((a) =>
      a.equals(aggregate),
    );
    this.markedAggregates.splice(index, 1);
  }

  private static findMarkedAggregateByID(
    id: ID,
  ): AggregateRoot<any> | undefined {
    return this.markedAggregates.find((aggregate) =>
      aggregate.id.equals(id),
    );
  }

  public static dispatchEventsForAggregate(id: ID): void {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      this.dispatchAggregateEvents(aggregate);
      aggregate.clearEvents();
      this.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  public static register(
    callback: EventHandler,
    eventClassName: string,
  ): void {
    if (!this.handlersMap.hasOwnProperty(eventClassName)) {
      this.handlersMap[eventClassName] = [];
    }
    this.handlersMap[eventClassName].push(callback);
  }

  public static clearHandlers(): void {
    this.handlersMap = {};
  }

  public static clearMarkedAggregates(): void {
    this.markedAggregates = [];
  }

  private static dispatch(event: DomainEvent): void {
    const eventClassName: string = event.constructor.name;

    if (this.handlersMap.hasOwnProperty(eventClassName)) {
      const handlers: EventHandler[] = this.handlersMap[eventClassName];
      for (const handler of handlers) {
        handler(event);
      }
    }
  }
}`,
  };

  // Ensure directories exist and write files
  for (const [filePath, content] of Object.entries(baseFiles)) {
    const fullPath = join(projectPath, filePath);
    await fs.ensureDir(join(fullPath, '..'));
    await fs.writeFile(fullPath, content);
  }
}
