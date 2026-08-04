export interface ApplicationErrorOptions {
  cause?: unknown;
}

/** An expected application failure without transport or framework dependencies. */
export class ApplicationError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options: ApplicationErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'ApplicationError';
    this.code = code;
  }
}
