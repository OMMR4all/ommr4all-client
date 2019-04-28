import {Point, Rect} from '../../geometry/geometry';
import {Page} from './page';

export interface UserCommentHolder {
  commentOrigin: Point;
  id: string;
}

export class UserComment {
  public text = '';
  public aabb: Rect = null;

  constructor(
    private _userComments: UserComments,
    public holder: UserCommentHolder = null,
  ) {
  }

  static fromJson(json, userComments: UserComments, holder: UserCommentHolder = null) {
    const c = new UserComment(userComments, holder);
    if (!json) { return c; }
    c.text = json.text || '';
    c.aabb = json.rect ? Rect.fromJSON(json.rect) : null;
    return c;
  }

  get userComments() { return this._userComments; }
  get empty() { return this.text.length === 0; }

  toJson() {
    return {
      'id': this.holder ? this.holder.id : null,
      'text': this.text,
      'aabb': this.aabb ? this.aabb.toJSON() : null,
    };
  }
}

export class UserComments {
  constructor(
    private _page: Page,
    private _comments = new Array<UserComment>(),
  ) {
  }

  static fromJson(json, page: Page) {
    const comments = new UserComments(page);
    const onlyValid = !!page;
    if (json) {
      comments._comments = json.comments.map(c => UserComment.fromJson(c, comments, comments.findHolderById(c.id))).filter(c => c.holder || !onlyValid);
    }
    return comments;
  }

  toJson() {
    return {
      comments: this._comments.map(c => c.toJson()),
    };
  }

  get comments() { return this._comments; }

  getByHolder(holder: UserCommentHolder) { return this._comments.find(c => c.holder === holder); }
  getByHolderId(id: string) { return this._comments.find(c => c.holder.id === id); }

  findHolderById(id: string): UserCommentHolder {
    if (!this._page) { return null; }  // no page specified, anonymous comments
    for (const block of this._page.blocks) {
      if (block.id === id) { return block; }
      for (const line of block.lines) {
        if (line.id === id) { return line; }
        for (const staffLine of line.staffLines) {
          if (staffLine.id === id) { return staffLine; }
        }
        for (const symbol of line.symbols) {
          if (symbol.id === id) { return symbol; }
        }
      }
    }
    for (const c of this._page.annotations.connections) {
      for (const sc of c.syllableConnectors) {
        if (sc.id === id) { return sc; }
      }
    }
    console.warn('Comment holder with id ' + id + ' not found.');
    return null;
  }


}
