export enum ErrorCodes {
  // global
  UnknownError = 1000,

  ConnectionToServerTimedOut = 10001,

  // Book related
  BookExists = 41001,
  BookInvalidName = 41002,

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
