export interface AuthenticatedUser {
  token: string;
  permissions: string[];
}

export interface RestAPIUser {
  username: string;
  firstName: string;
  lastName: string;
}

export interface RestAPIGroup {
  name: string;
}

export interface RestAPIUserBookPermissions {
  flags: number;
}
