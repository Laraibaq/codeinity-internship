import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = isHttpException
      ? exception.getResponse()
      : null;

    // Build user-facing response payload
    let message: any = 'Internal server error';

    if (isHttpException) {
      if (typeof errorResponse === 'object' && errorResponse !== null) {
        message = (errorResponse as any).message || errorResponse;
      } else {
        message = errorResponse || exception.message;
      }
    } else {
      // In production or unhandled errors: do not disclose stack traces or raw database query errors to clients
      message = 'Internal server error';
    }

    // Always log the complete error with context on the server
    const logDetails = {
      statusCode: status,
      path: request?.url,
      method: request?.method,
      ip: request?.ip,
      userAgent: request?.headers ? request.headers['user-agent'] : undefined,
      timestamp: new Date().toISOString(),
      error: exception instanceof Error ? exception.stack : String(exception),
    };

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} [${request?.method} ${request?.url}]: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} [${request?.method} ${request?.url}]: ${JSON.stringify(message)}`,
      );
    }

    // Send clean JSON response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url,
      message,
      // Optional machine-readable reason (e.g. OFFER_EXPIRED) so clients can branch on it
      // instead of string-matching message text.
      ...(isHttpException && typeof errorResponse === 'object' && (errorResponse as any)?.code
        ? { code: (errorResponse as any).code }
        : {}),
    });
  }
}
