/** Port used by application modules that need password hashing. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
  needsRehash(hash: string): boolean;
}

/** Safe error raised when the password hashing infrastructure cannot operate. */
export class PasswordHasherError extends Error {
  constructor() {
    super('Password hashing is unavailable.');
    this.name = 'PasswordHasherError';
  }
}
