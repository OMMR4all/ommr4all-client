import {HttpErrorResponse} from '@angular/common/http';

export enum ErrorCodes {
  // global
  UnknownError = 1000,

  ConnectionToServerTimedOut = 10001,

  // Book related
  BookExists = 41001,
  BookInvalidName = 41002,

  BookPageUploadFailedPayloadTooLarge = 41010,

  // Page related
  PageExists = 44001,
  PageInvalidName = 44002,
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
}
