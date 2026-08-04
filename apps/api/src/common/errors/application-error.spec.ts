import { ApplicationError } from './application-error';

describe('ApplicationError', () => {
  it('preserves the stable code and cause without framework dependencies', () => {
    const cause = new Error('database detail');
    const error = new ApplicationError('RESOURCE_NOT_FOUND', 'missing user', { cause });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApplicationError');
    expect(error.code).toBe('RESOURCE_NOT_FOUND');
    expect(error.message).toBe('missing user');
    expect(error.cause).toBe(cause);
  });
});
