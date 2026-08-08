import { ApplicationError } from '../../common/errors/application-error';

export const USER_NOT_FOUND = 'USER_NOT_FOUND';
export const USER_EMAIL_CONFLICT = 'USER_EMAIL_CONFLICT';
export const USERNAME_CONFLICT = 'USERNAME_CONFLICT';

export function userNotFound(): ApplicationError {
  return new ApplicationError(USER_NOT_FOUND, 'The requested user was not found.');
}

export function userIdentityConflict(field: 'email' | 'userName'): ApplicationError {
  return new ApplicationError(
    field === 'email' ? USER_EMAIL_CONFLICT : USERNAME_CONFLICT,
    field === 'email' ? 'The email is already in use.' : 'The user name is already in use.'
  );
}
