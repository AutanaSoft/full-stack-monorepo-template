import type { ConfigType } from '@nestjs/config';
import helmetConfig from '../../config/helmet.config';
import { createHelmetOptions } from './helmet.options';

function makeHelmetConfig(enabled: boolean): ConfigType<typeof helmetConfig> {
  return { HELMET_ENABLED: enabled };
}

describe('Helmet options', () => {
  it('returns empty options so Helmet keeps its secure defaults when enabled', () => {
    expect(createHelmetOptions(makeHelmetConfig(true))).toEqual({});
  });

  it('disables Helmet middleware when configured off', () => {
    expect(createHelmetOptions(makeHelmetConfig(false))).toBeUndefined();
  });
});
