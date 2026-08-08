import { PasswordConfigSchema, passwordConfigFactory } from './password.config';

describe('API password configuration', () => {
  it('keeps production-oriented Argon2id defaults explicit', () => {
    expect(PasswordConfigSchema.parse({})).toEqual({
      ARGON2_MEMORY_COST: 65_536,
      ARGON2_TIME_COST: 3,
      ARGON2_PARALLELISM: 1,
    });
  });

  it('allows explicit lower-cost test overrides', () => {
    expect(
      passwordConfigFactory({
        ARGON2_MEMORY_COST: '8192',
        ARGON2_TIME_COST: '2',
        ARGON2_PARALLELISM: '1',
      })
    ).toEqual({
      ARGON2_MEMORY_COST: 8192,
      ARGON2_TIME_COST: 2,
      ARGON2_PARALLELISM: 1,
    });
  });

  it.each([
    { ARGON2_MEMORY_COST: '7' },
    { ARGON2_MEMORY_COST: '4194305' },
    { ARGON2_TIME_COST: '1' },
    { ARGON2_TIME_COST: '0' },
    { ARGON2_TIME_COST: '11' },
    { ARGON2_PARALLELISM: '0' },
    { ARGON2_PARALLELISM: '33' },
  ])('rejects invalid Argon2 parameters: %p', (input) => {
    expect(() => PasswordConfigSchema.parse(input)).toThrow();
  });
});
