import * as argon2 from 'argon2';
import { Argon2PasswordHasher } from './argon2-password-hasher';
import { PasswordHasherError } from './password-hasher';

jest.mock('argon2', () => {
  const actual = jest.requireActual<typeof import('argon2')>('argon2');

  return {
    ...actual,
    hash: jest.fn(actual.hash),
    verify: jest.fn(actual.verify),
    needsRehash: jest.fn(actual.needsRehash),
  };
});

const nativeArgon2 = jest.requireActual<typeof import('argon2')>('argon2');

const config = {
  ARGON2_MEMORY_COST: 8_192,
  ARGON2_TIME_COST: 2,
  ARGON2_PARALLELISM: 1,
};

describe('Argon2PasswordHasher', () => {
  let hasher: Argon2PasswordHasher;

  beforeEach(() => {
    hasher = new Argon2PasswordHasher(config);
  });

  afterEach(() => {
    jest.mocked(argon2.hash).mockImplementation(nativeArgon2.hash);
    jest.mocked(argon2.verify).mockImplementation(nativeArgon2.verify);
    jest.mocked(argon2.needsRehash).mockImplementation(nativeArgon2.needsRehash);
    jest.clearAllMocks();
  });

  it('hashes with Argon2id and verifies matching and non-matching passwords', async () => {
    const password = 'unit-test-password';
    const hash = await hasher.hash(password);

    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(hasher.verify(password, hash)).resolves.toBe(true);
    await expect(hasher.verify('different-password', hash)).resolves.toBe(false);
  });

  it('forwards the configured cost parameters without exposing the password', async () => {
    const hash = jest.mocked(argon2.hash).mockResolvedValue('safe-hash-result');

    await expect(hasher.hash('opaque-password')).resolves.toBe('safe-hash-result');

    expect(hash).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        type: argon2.argon2id,
        memoryCost: config.ARGON2_MEMORY_COST,
        timeCost: config.ARGON2_TIME_COST,
        parallelism: config.ARGON2_PARALLELISM,
      }),
    );
  });

  it.each([
    ['', 'safe-hash'],
    ['valid-password', ''],
    ['valid-password', '$argon2id$malformed'],
  ])('handles invalid input safely: %p', async (password, hash) => {
    await expect(hasher.verify(password, hash)).resolves.toBe(false);
  });

  it('rejects an empty password without including input in the error', async () => {
    await expect(hasher.hash('')).rejects.toEqual(new PasswordHasherError());
  });

  it('translates native hashing failures to a safe error', async () => {
    jest.mocked(argon2.hash).mockRejectedValue(new Error('native failure with sensitive data'));

    await expect(hasher.hash('opaque-password')).rejects.toEqual(new PasswordHasherError());
  });

  it('translates native verification failures to a safe error', async () => {
    jest.mocked(argon2.verify).mockRejectedValue(new Error('native failure with sensitive data'));

    await expect(
      hasher.verify('opaque-password', '$argon2id$v=19$m=8192,t=2,p=1$c2FsdA$aGFzaA'),
    ).rejects.toEqual(new PasswordHasherError());
  });

  it('recognizes hashes created with changed parameters as requiring rehash', async () => {
    const hash = await hasher.hash('opaque-password');
    const changedHasher = new Argon2PasswordHasher({
      ...config,
      ARGON2_TIME_COST: 3,
    });

    expect(hasher.needsRehash(hash)).toBe(false);
    expect(changedHasher.needsRehash(hash)).toBe(true);
  });

  it('does not treat malformed hashes as requiring rehash', () => {
    expect(hasher.needsRehash('not-an-argon2-hash')).toBe(false);
  });
});
