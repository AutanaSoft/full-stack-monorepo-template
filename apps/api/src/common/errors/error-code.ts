export const ERROR_DEFINITIONS = {
  VALIDATION_FAILED: {
    statusCode: 400,
    message: 'The request is invalid.',
  },
  RESOURCE_NOT_FOUND: {
    statusCode: 404,
    message: 'The requested resource was not found.',
  },
  USER_NOT_FOUND: {
    statusCode: 404,
    message: 'The requested user was not found.',
  },
  USER_EMAIL_CONFLICT: {
    statusCode: 409,
    message: 'The email is already in use.',
  },
  USERNAME_CONFLICT: {
    statusCode: 409,
    message: 'The user name is already in use.',
  },
  RATE_LIMIT_EXCEEDED: {
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
  },
  INTERNAL_ERROR: {
    statusCode: 500,
    message: 'An unexpected error occurred.',
  },
} as const;

export type ErrorCode = keyof typeof ERROR_DEFINITIONS;

export type ErrorDefinition = {
  statusCode: number;
  message: string;
};

export function getErrorDefinition(code: ErrorCode): ErrorDefinition;
export function getErrorDefinition(code: string): ErrorDefinition | undefined;
export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return ERROR_DEFINITIONS[code as ErrorCode];
}
