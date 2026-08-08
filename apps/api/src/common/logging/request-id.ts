import type { IncomingHttpHeaders } from 'node:http';
import { randomUUID } from 'node:crypto';
import { RequestIdSchema } from '@autanasoft/contracts';

export type RequestIdHeaderValue = string | string[] | undefined;
export type RequestIdHeaders = Readonly<Record<string, RequestIdHeaderValue>>;

/** Returns the configured header value without accepting duplicate header values. */
export function getRequestIdHeaderValue(
  headers: IncomingHttpHeaders | RequestIdHeaders,
  headerName: string
): RequestIdHeaderValue {
  const normalizedHeaderName = headerName.toLowerCase();
  const matchingHeaderName = Object.keys(headers).find(
    (name) => name.toLowerCase() === normalizedHeaderName
  );

  return matchingHeaderName === undefined ? undefined : headers[matchingHeaderName];
}

export function isValidRequestId(value: unknown): value is string {
  return typeof value === 'string' && RequestIdSchema.safeParse(value).success;
}

/** Preserves only a single contract-compliant ID; all other inputs receive a UUID. */
export function resolveRequestId(
  headers: IncomingHttpHeaders | RequestIdHeaders,
  headerName: string,
  generateRequestId: () => string = randomUUID
): string {
  const candidate = getRequestIdHeaderValue(headers, headerName);

  if (isValidRequestId(candidate)) {
    return candidate;
  }

  return RequestIdSchema.parse(generateRequestId());
}
