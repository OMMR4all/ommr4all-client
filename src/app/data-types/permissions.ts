export enum BookPermissionFlag {
  None = 0,
  Read = 1,
  Save = 2,
  Edit = 512,
  EditPermissions = 4,
  AddPages = 8,
  DeletePages = 16,
  RenamePages = 32,
  DeleteBook = 64,
  EditBookMeta = 128,
  VerifyPage = 256,

  Write = Edit | Save, // tslint:disable-line no-bitwise
  ReadEdit = Read | Edit, // tslint:disable-line no-bitwise
  ReadWrite = Read | Save | Edit, // tslint:disable-line no-bitwise
  Pages = AddPages | DeletePages | RenamePages,  // tslint:disable-line no-bitwise

  RightsNone = None,
  RightsRead = Read,
  RightsWrite = RightsRead | Save,            // tslint:disable-line no-bitwise
  RightsMaintainer = RightsWrite | Pages | EditBookMeta | VerifyPage,  // tslint:disable-line no-bitwise
  RightsAdmin = RightsMaintainer | EditPermissions | DeleteBook, // tslint:disable-line no-bitwise
  RightsDemo = ReadEdit,
}

export class BookPermissionFlags {
  static fromJson(json: any) {
    return new BookPermissionFlags(json.flags);
  }

  constructor(
    public flags = 0,
  ) {}

  has(flag: number) { return (this.flags & flag) === flag; }              // tslint:disable-line no-bitwise
  set(flag: number) { this.flags |= flag; }                               // tslint:disable-line no-bitwise
  erase(flag) { if (this.has(flag)) { this.flags -= flag; } }
}

export class BookPermissions {
  static fromJson(json: any) {
    const permissions = new BookPermissions();
    Object.keys(json.users).forEach(k => permissions.users.set(k, new BookPermissionFlags(json.users[k].flags)));
    Object.keys(json.groups).forEach(k => permissions.groups.set(k, new BookPermissionFlags(json.groups[k].flags)));
    permissions.other.flags = json.default.flags;
    return permissions;

  }
  constructor(
    public users = new Map<string, BookPermissionFlags>(),
    public groups = new Map<string, BookPermissionFlags>(),
    public other = new BookPermissionFlags(),
  ) {}

}
