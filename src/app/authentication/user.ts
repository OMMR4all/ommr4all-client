export interface AuthenticatedUser {
  permissions: string[];
  access: string;
  refresh: string;
  // Django staff/superuser; the administrative global permissions can also be granted separately
  is_admin?: boolean;
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

export const unknownRestAPIUser: RestAPIUser = {
  username: undefined,
  firstName: 'Unknown',
  lastName: 'User',
};
