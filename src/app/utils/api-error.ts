import { HttpErrorResponse } from '@angular/common/http';

export enum ErrorCodes {
  // global
  UnknownError = 1000,
  InvalidCredentials = 1001,
  SessionExpired = 1002,

  ConnectionToServerTimedOut = 10001,
  ServerDatabaseUnavailable = 10002,

  // Book related
  BookExists = 41001,
  BookInvalidName = 41002,

  BookPageUploadFailedPayloadTooLarge = 41010,

  // Page related
  PageExists = 44001,
  PageInvalidName = 44002,

  // Monodi related
  MonodiLoginRequired = 65000,
}

export interface ApiError {
  status: number;
  developerMessage: string;
  userMessage: string;
  errorCode: ErrorCodes;
}

export const apiErrorFromHttpErrorResponse = (resp: HttpErrorResponse) => {
  const apiError = resp.error as ApiError;
  if (apiError && apiError.errorCode) {
    return apiError;
  } else if (resp.status === 401) {
    // the JWT expired or the user logged out; the ErrorInterceptor sends them to the
    // login page. Nothing is wrong with the server or the request itself.
    return {
      status: resp.status,
      developerMessage: 'Unauthenticated: the access token is missing or expired',
      userMessage: $localize`:@@sessionExpiredMessage:Your session has expired. Please log in again to continue. Running tasks are not affected and keep running on the server.`,
      errorCode: ErrorCodes.SessionExpired,
    };
  } else if (resp.status === 503) {
    // the server reached its database but it failed even after reconnecting; the request is
    // worth retrying, and nothing the user did was lost
    return {
      status: resp.status,
      developerMessage: 'The server database is unavailable',
      userMessage: $localize`The server database is temporarily unavailable. Your work is not lost, please retry in a moment.`,
      errorCode: ErrorCodes.ServerDatabaseUnavailable,
    };
  } else if (resp.status === 504) {
    return {
      status: resp.status,
      developerMessage: 'Server is unavailable',
      userMessage: 'No connection to the server. The server might be in maintenance, please wait a few minutes and retry. ' +
        'Please also check your internet connection.',
      errorCode: ErrorCodes.ConnectionToServerTimedOut,
    };
  } else {
    return {
      status: resp.status,
      developerMessage: 'Unknown server error',
      userMessage: 'Unknown error. Please contact the administrator',
      errorCode: ErrorCodes.UnknownError,
    };
  }
};
