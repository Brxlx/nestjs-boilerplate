import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware personalizado para logging de requisições HTTP
 *
 * Este middleware captura informações detalhadas sobre cada requisição,
 * incluindo tempo de resposta, status codes, user agents, IPs, etc.
 *
 * Características:
 * - ✅ Logging estruturado com contexto completo
 * - ✅ Medição precisa de performance
 * - ✅ Detecção de requisições lentas
 * - ✅ Sanitização de dados sensíveis
 * - ✅ Correlação de requests via correlation ID
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    // Adiciona correlation ID ao request para rastreamento
    req['correlationId'] = correlationId;

    // Captura informações da requisição
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';

    // Log da requisição de entrada
    this.logger.log({
      message: 'Incoming Request',
      correlationId,
      method,
      url: originalUrl,
      ip: this.sanitizeIp(ip!),
      userAgent: this.sanitizeUserAgent(userAgent),
      timestamp: new Date().toISOString(),
    });

    // Intercepta o final da resposta
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // Determina o nível de log baseado no status e duração
      const logLevel = this.getLogLevel(statusCode, duration);

      const logData = {
        message: 'Request Completed',
        correlationId,
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip: this.sanitizeIp(ip!),
        userAgent: this.sanitizeUserAgent(userAgent),
        timestamp: new Date().toISOString(),
      };

      // Log baseado no nível determinado
      switch (logLevel) {
        case 'error':
          this.logger.error(logData);
          break;
        case 'warn':
          this.logger.warn(logData);
          break;
        default:
          this.logger.log(logData);
      }

      // Log adicional para requisições lentas
      if (duration > 1000) {
        this.logger.warn({
          message: 'Slow Request Detected',
          correlationId,
          method,
          url: originalUrl,
          duration: `${duration}ms`,
          threshold: '1000ms',
        });
      }
    });

    next();
  }

  /**
   * Gera um ID único para correlação de requests
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitiza o IP removendo informações sensíveis
   */
  private sanitizeIp(ip: string): string {
    if (!ip) return 'Unknown';

    // Remove IPs internos em produção
    if (process.env.NODE_ENV === 'production') {
      if (
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip === '127.0.0.1'
      ) {
        return 'Internal';
      }
    }

    return ip;
  }

  /**
   * Sanitiza o User Agent removendo informações muito detalhadas
   */
  private sanitizeUserAgent(userAgent: string): string {
    if (!userAgent) return 'Unknown';

    // Limita o tamanho do user agent para logs
    return userAgent.length > 200
      ? userAgent.substring(0, 200) + '...'
      : userAgent;
  }

  /**
   * Determina o nível de log baseado no status code e duração
   */
  private getLogLevel(
    statusCode: number,
    duration: number,
  ): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400 || duration > 2000) return 'warn';
    return 'log';
  }
}
