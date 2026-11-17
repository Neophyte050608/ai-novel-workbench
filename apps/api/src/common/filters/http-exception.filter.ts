import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type HttpRequest = { url: string };
type HttpResponse = { status: (statusCode: number) => { json: (body: unknown) => void } };

type ErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function normalizeHttpResponse(exception: HttpException): { code: string; message: string; details?: unknown } {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return { code: exception.name, message: response };
  }

  if (response && typeof response === 'object') {
    const payload = response as Record<string, unknown>;
    const message = Array.isArray(payload.message) ? payload.message.join('; ') : typeof payload.message === 'string' ? payload.message : exception.message;
    return {
      code: typeof payload.error === 'string' ? payload.error : exception.name,
      message,
      details: payload.message,
    };
  }

  return { code: exception.name, message: exception.message };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();
    const request = ctx.getRequest<HttpRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      success: false,
      error: {
        code: 'InternalServerError',
        message: 'Internal server error',
      },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = {
        success: false,
        error: normalizeHttpResponse(exception),
      };
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        body = {
          success: false,
          error: { code: 'NotFound', message: 'Resource not found' },
        };
      } else if (exception.code === 'P2002') {
        status = HttpStatus.BAD_REQUEST;
        body = {
          success: false,
          error: { code: 'UniqueConstraintViolation', message: 'A resource with the same unique field already exists' },
        };
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        body = {
          success: false,
          error: { code: 'InvalidRelation', message: 'Referenced resource does not exist' },
        };
      }
    }

    response.status(status).json({
      ...body,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
