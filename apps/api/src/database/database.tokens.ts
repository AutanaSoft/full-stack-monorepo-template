import type { InjectionToken } from '@nestjs/common';

/** Runtime token for the framework-independent database connection contract. */
export const DATABASE_CONNECTION: InjectionToken = Symbol('DATABASE_CONNECTION');

/** Narrow database capability used by infrastructure indicators without exposing the ORM. */
export interface DatabasePing {
  ping(): Promise<void>;
}

export const DATABASE_PING: InjectionToken = Symbol('DATABASE_PING');
