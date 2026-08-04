import type { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import passwordConfig from '../config/password.config';
import { Argon2PasswordHasher } from './argon2-password-hasher';
import { PasswordModule } from './password.module';
import { PASSWORD_HASHER } from './password.tokens';

describe('PasswordModule', () => {
  it('exports the port token backed by the Argon2 adapter', async () => {
    const config: ConfigType<typeof passwordConfig> = {
      ARGON2_MEMORY_COST: 8_192,
      ARGON2_TIME_COST: 1,
      ARGON2_PARALLELISM: 1,
    };
    const moduleRef = await Test.createTestingModule({
      imports: [PasswordModule],
    })
      .overrideProvider(passwordConfig.KEY)
      .useValue(config)
      .compile();

    expect(moduleRef.get(PASSWORD_HASHER)).toBeInstanceOf(Argon2PasswordHasher);
    await moduleRef.close();
  });
});
