import { HttpContextToken } from '@angular/common/http';

/** Marks a request that was already replayed after a session recovery, so a request the
 *  server keeps answering with 401 fails instead of looping. */
export const ALREADY_RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * Marks a request the user triggered themselves and whose failure would cost them work,
 * i.e. the editor's save and its page lock.
 *
 * Only those are worth interrupting with a password prompt: everything else -- the
 * requests fired while the app boots, the task and lock pollers, the book and style
 * lists -- runs without anybody waiting for it, and a modal dialog on top of the front
 * page is not a thing the user asked for. Those log out quietly instead (see
 * AuthenticationService.expireSession).
 */
export const INTERACTIVE_AUTH = new HttpContextToken<boolean>(() => false);
