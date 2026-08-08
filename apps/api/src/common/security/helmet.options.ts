import type { ConfigType } from '@nestjs/config';
import type { HelmetOptions } from 'helmet';
import helmetConfig from '../../config/helmet.config';

/** Returns Helmet defaults only when the configured security middleware is enabled. */
export function createHelmetOptions(
  config: ConfigType<typeof helmetConfig>
): HelmetOptions | undefined {
  return config.HELMET_ENABLED ? {} : undefined;
}
