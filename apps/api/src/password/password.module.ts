import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Argon2PasswordHasher } from './argon2-password-hasher';
import passwordConfig from '../config/password.config';
import { PASSWORD_HASHER } from './password.tokens';

@Module({
  imports: [ConfigModule.forFeature(passwordConfig)],
  providers: [
    Argon2PasswordHasher,
    {
      provide: PASSWORD_HASHER,
      useExisting: Argon2PasswordHasher,
    },
  ],
  exports: [PASSWORD_HASHER],
})
export class PasswordModule {}
