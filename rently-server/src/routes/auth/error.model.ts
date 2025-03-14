import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

export const InvalidOTPException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidOTP',
    path: 'code',
  },
]);

export const OTPExpiredException = new UnprocessableEntityException([
  {
    message: 'Error.OTPExpired',
    path: 'code',
  },
]);

export const FailedToSendOTPException = new UnprocessableEntityException([
  {
    message: 'Error.FailedToSendOTP',
    path: 'code',
  },
]);

export const EmailAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Error.EmailAlreadyExists',
    path: 'email',
  },
]);

export const EmailNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.EmailNotFound',
    path: 'email',
  },
]);

export const UserNotFoundException = new UnprocessableEntityException([
  {
    message: 'Error.UserNotFound',
    path: 'email',
  },
]);

export const InvalidPasswordException = new UnprocessableEntityException([
  {
    message: 'Error.InvalidPassword',
    path: 'password',
  },
]);

export const RefreshTokenAlreadyUsedException = new UnauthorizedException(
  'Error.RefreshTokenAlreadyUsed',
);

export const UnauthorizedAccessException = new UnauthorizedException(
  'Error.UnauthorizedAccess',
);

export const GoogleUserInfoError = new Error('Error.FailedToGetGoogleUserInfo');
