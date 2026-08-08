import { getRequestIdHeaderValue, isValidRequestId, resolveRequestId } from './request-id';

describe('request ID helpers', () => {
  it('reads the configured header case-insensitively and preserves a valid value', () => {
    const generateRequestId = jest.fn(() => 'generated-id');

    expect(getRequestIdHeaderValue({ 'X-Request-ID': 'client-request-123' }, 'x-request-id')).toBe(
      'client-request-123'
    );
    expect(
      resolveRequestId({ 'X-Request-ID': 'client-request-123' }, 'x-request-id', generateRequestId)
    ).toBe('client-request-123');
    expect(generateRequestId).not.toHaveBeenCalled();
  });

  it.each([
    ['multiple values', ['valid-request-id']],
    ['empty value', ''],
    ['whitespace', 'request id'],
    ['control character', 'request\n-id'],
    ['too long', 'a'.repeat(129)],
  ])('replaces %s with a generated ID', (_description, value) => {
    const generateRequestId = jest.fn(() => 'generated-id');

    expect(resolveRequestId({ 'x-request-id': value }, 'x-request-id', generateRequestId)).toBe(
      'generated-id'
    );
    expect(generateRequestId).toHaveBeenCalledTimes(1);
  });

  it('accepts only contract-compliant strings', () => {
    expect(isValidRequestId('valid.request/123')).toBe(true);
    expect(isValidRequestId(['valid.request/123'])).toBe(false);
    expect(isValidRequestId(undefined)).toBe(false);
    expect(isValidRequestId('invalid request id')).toBe(false);
  });
});
