import { Prisma } from '.prisma/client';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

/**
 * ExceptionFilter to attach to routes using Prisma.
 * Will catch `PrismaClientKnownRequestError` such as unique constraint validation and provide a helpful message.
 * Will catch `PrismaClientValidationError` but you should ideally have your own validation instead of falling back on this.
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const responseData = this.formResponse(exception);

    response.status(responseData.statusCode).json(responseData);
  }

  formResponse(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
  ) {
    if (exception instanceof Prisma.PrismaClientValidationError) {
      const errorLines = filterForErrorLines(exception.message);
      const fieldTargetErrors = extractFieldsFromErrorLines(errorLines);
      return {
        statusCode: 400,
        error: 'Bad Request',
        message: {
          target: fieldTargetErrors,
        },
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        statusCode: 400,
        prismaCode: exception.code,
        error: 'Bad Request',
        message: exception.meta,
      };
    }
  }
}

/* Prisma error string will have problematic fields starting with a "+" */
const filterForErrorLines = (errorString: string) => {
  const lines = errorString.split('\n');
  return lines.filter((s: string) => s.startsWith('+'));
};

const extractFieldsFromErrorLines = (lines: string[]) => {
  const extractField = /\+.\s+(?<name>\w*):/;
  return lines.map((s) => s.match(extractField)[1]);
};
