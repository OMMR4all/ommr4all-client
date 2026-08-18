import {RestAPIUser, unknownRestAPIUser} from '../authentication/user';

export interface PageAssignmentProgress {
  total: number;
  existing: number;
  missing: number;
  untouched: number;
  inProgress: number;
  finished: number;
  verified: number;
  locks: {StaffLines: number, Layout: number, Symbols: number, Text: number};
}

export interface PageAssignment {
  id: string;
  user: RestAPIUser;
  userExists: boolean;
  userHasAccess: boolean;
  pages: string[];
  note: string;
  created: string;
  createdBy: string;
  updated: string;
  updatedBy: string;
  progress: PageAssignmentProgress;
}

export interface PageEditingUser {
  page: string;
  user: RestAPIUser;
  since: string;
}

export interface PageAssignmentsResponse {
  assignments: PageAssignment[];
  currentlyEditing: PageEditingUser[];
  pageOrder: string[];
  permissions: number;
  totalPages: number;
  assignedPages: number;
}

/**
 * Colour of a user, derived from the username alone.
 *
 * Deterministic on purpose: the same person keeps the same colour in the content view,
 * the editor sidebar and the overview table, across sessions and no matter how many
 * assignments a book has.
 */
export function userColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < (username || '').length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) | 0;
  }
  return 'hsl(' + (Math.abs(hash) % 360) + ', 62%, 52%)';
}

export function userInitials(user: RestAPIUser): string {
  if (!user) { return '?'; }
  const first = (user.firstName || '').trim();
  const last = (user.lastName || '').trim();
  if (first.length > 0 || last.length > 0) {
    return ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase();
  }
  return (user.username || '?').substr(0, 2).toUpperCase();
}

export function userLabel(user: RestAPIUser): string {
  if (!user || !user.username) { return unknownRestAPIUser.firstName + ' ' + unknownRestAPIUser.lastName; }
  const name = [user.firstName, user.lastName].filter(s => !!s && s.length > 0).join(' ');
  return name.length > 0 ? name + ' (' + user.username + ')' : user.username;
}

/**
 * Compact a set of page labels into ranges of consecutive pages, e.g. "001-012, 030".
 * Consecutive means adjacent in the book's page order, not lexicographically adjacent.
 */
export function compactRanges(pages: string[], pageOrder: string[]): string {
  const index = new Map<string, number>();
  pageOrder.forEach((p, i) => index.set(p, i));
  const known = pages.filter(p => index.has(p)).sort((a, b) => index.get(a) - index.get(b));
  const unknown = pages.filter(p => !index.has(p));

  const parts: string[] = [];
  let start: string = null;
  let previous: string = null;
  known.forEach(page => {
    if (start === null) {
      start = page;
    } else if (index.get(page) !== index.get(previous) + 1) {
      parts.push(start === previous ? start : start + '-' + previous);
      start = page;
    }
    previous = page;
  });
  if (start !== null) { parts.push(start === previous ? start : start + '-' + previous); }
  return parts.concat(unknown).join(', ');
}

/** Inverse of compactRanges: "001-012, 030" -> page labels. Unknown labels are returned, too,
 *  so the dialog can point at them instead of silently dropping the user's input. */
export function parseRanges(text: string, pageOrder: string[]): {pages: string[], unknown: string[]} {
  const index = new Map<string, number>();
  pageOrder.forEach((p, i) => index.set(p, i));
  const pages: string[] = [];
  const unknown: string[] = [];

  (text || '').split(',').map(s => s.trim()).filter(s => s.length > 0).forEach(part => {
    const range = part.split('-').map(s => s.trim());
    if (range.length === 2 && index.has(range[0]) && index.has(range[1])) {
      const from = Math.min(index.get(range[0]), index.get(range[1]));
      const to = Math.max(index.get(range[0]), index.get(range[1]));
      for (let i = from; i <= to; i++) { pages.push(pageOrder[i]); }
    } else if (index.has(part)) {
      pages.push(part);
    } else {
      unknown.push(part);
    }
  });

  return {pages: Array.from(new Set(pages)), unknown};
}

export function expandRange(from: string, to: string, pageOrder: string[]): string[] {
  const fromIndex = pageOrder.indexOf(from);
  const toIndex = pageOrder.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) { return []; }
  return pageOrder.slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex) + 1);
}

/** Queryable view of one book's assignments, built once per fetch. */
export class PageAssignmentsIndex {
  private readonly _byPage = new Map<string, PageAssignment[]>();
  private readonly _editorsByPage = new Map<string, PageEditingUser[]>();

  constructor(readonly response: PageAssignmentsResponse) {
    (response.assignments || []).forEach(assignment => {
      assignment.pages.forEach(page => {
        const list = this._byPage.get(page);
        if (list) { list.push(assignment); } else { this._byPage.set(page, [assignment]); }
      });
    });
    (response.currentlyEditing || []).forEach(editing => {
      const list = this._editorsByPage.get(editing.page);
      if (list) { list.push(editing); } else { this._editorsByPage.set(editing.page, [editing]); }
    });
  }

  get assignments() { return this.response.assignments || []; }
  get pageOrder() { return this.response.pageOrder || []; }

  forPage(page: string): PageAssignment[] { return this._byPage.get(page) || []; }
  editorsOf(page: string): PageEditingUser[] { return this._editorsByPage.get(page) || []; }

  pagesOf(username: string): Set<string> {
    const pages = new Set<string>();
    if (!username) { return pages; }
    this.assignments.filter(a => a.user.username === username)
      .forEach(a => a.pages.forEach(p => pages.add(p)));
    return pages;
  }

  isAssignedTo(page: string, username: string): boolean {
    return !!username && this.forPage(page).some(a => a.user.username === username);
  }

  /** Number of pages assigned to more than one user (the overview's overlap hint). */
  get multiAssignedPageCount(): number {
    let count = 0;
    this._byPage.forEach(assignments => {
      if (new Set(assignments.map(a => a.user.username)).size > 1) { count++; }
    });
    return count;
  }
}

/** What a page tile needs to render its assignment state. */
export interface PagePreviewAssignee {
  username: string;
  initials: string;
  color: string;
  mine: boolean;
  tooltip: string;
}

export function assigneesOfPage(index: PageAssignmentsIndex, page: string,
                                username: string): PagePreviewAssignee[] {
  return index.forPage(page).map(assignment => {
    const note = (assignment.note || '').trim();
    const shortNote = note.length > 80 ? note.substr(0, 80) + '\u2026' : note;
    const who = userLabel(assignment.user);
    return {
      username: assignment.user.username,
      initials: userInitials(assignment.user),
      color: userColor(assignment.user.username),
      mine: !!username && assignment.user.username === username,
      tooltip: $localize`Assigned to ${who}:who:` + (shortNote.length > 0 ? '\n' + shortNote : ''),
    };
  });
}

/** Page-label keyed assignee lists, built once per fetch so the tile lookup is a map hit. */
export function assigneesByPage(index: PageAssignmentsIndex,
                                username: string): Map<string, PagePreviewAssignee[]> {
  const map = new Map<string, PagePreviewAssignee[]>();
  if (!index) { return map; }
  index.pageOrder.forEach(page => {
    const assignees = assigneesOfPage(index, page, username);
    if (assignees.length > 0) { map.set(page, assignees); }
  });
  return map;
}
