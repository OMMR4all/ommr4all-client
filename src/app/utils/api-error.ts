import { HttpErrorResponse } from '@angular/common/http';

export enum ErrorCodes {
  // global
  UnknownError = 1000,
  InvalidCredentials = 1001,
  // client-only sentinels; the server enum (restapi/models/error.py) has neither
  SessionExpired = 1002,
  NotAuthenticated = 1003,

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
    // No usable token. Whether a session ended or there never was one is not decidable
    // here, and claiming an expiry is how anonymous visitors were told their session had
    // run out -- AuthenticationService owns that message, this one only states the fact.
    return {
      status: resp.status,
      developerMessage: 'Unauthenticated: the access token is missing or expired',
      userMessage: $localize`:@@notAuthenticatedMessage:You are not logged in. Please log in to continue.`,
      errorCode: ErrorCodes.NotAuthenticated,
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
