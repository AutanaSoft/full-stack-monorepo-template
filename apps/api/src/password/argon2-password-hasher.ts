import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
import passwordConfig from '../config/password.config';
import { PasswordHasherError } from './password-hasher';
import type { PasswordHasher } from './password-hasher';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
} as const;

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  constructor(
    @Inject(passwordConfig.KEY)
    private readonly config: ConfigType<typeof passwordConfig>,
  ) {}

  async hash(password: string): Promise<string> {
    this.assertPassword(password);

    try {
      return await argon2.hash(password, this.options());
    } catch {
      throw new PasswordHasherError();
    }
  }

  async verify(password: string, hash: string): Promise<boolean> {
    if (!this.isPassword(password) || !this.isArgon2Hash(hash)) {
      return false;
    }

    try {
      return await argon2.verify(hash, password);
    } catch {
      throw new PasswordHasherError();
    }
  }

  needsRehash(hash: string): boolean {
    if (!this.isArgon2Hash(hash)) {
      return false;
    }

    try {
      return argon2.needsRehash(hash, this.options());
    } catch {
      return false;
    }
  }

  private options(): argon2.Options & { raw?: false } {
    return {
      ...ARGON2_OPTIONS,
      memoryCost: this.config.ARGON2_MEMORY_COST,
      timeCost: this.config.ARGON2_TIME_COST,
      parallelism: this.config.ARGON2_PARALLELISM,
    };
  }

  private assertPassword(password: string): void {
    if (!this.isPassword(password)) {
      throw new PasswordHasherError();
    }
  }

  private isPassword(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  private isHash(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  private isArgon2Hash(value: unknown): value is string {
    return (
      this.isHash(value) &&
      /^\$argon2(?:d|i|id)\$v=\d+\$m=\d+,t=\d+,p=\d+\$[^$]+\$[^$]+$/.test(value)
    );
  }
}
