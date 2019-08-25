import {DefaultMap, equalMaps} from '../utils/data-structures';
import {enumMapToObj, objIntoEnumMap} from '../utils/converting';
import {EventEmitter} from '@angular/core';
import {PageCommunication} from './communication';
import {HttpClient} from '@angular/common/http';
import {error} from 'util';
import {catchError} from 'rxjs/operators';
import {of, throwError} from 'rxjs';

export enum PageProgressGroups {
  StaffLines,
  Layout,
  Symbols,
  Text,

  Verified = 100,
}

export class PageEditingProgress {
  readonly lockedChanged = new EventEmitter<{group: PageProgressGroups, value: boolean}>();

  static fromJson(json) {
    const pp = new PageEditingProgress();
    objIntoEnumMap(json.locked, pp.locked, PageProgressGroups);
    return pp;
  }
  toJson() {
    return {
      locked: enumMapToObj(this.locked, PageProgressGroups)
    };
  }
  constructor(
    private locked = DefaultMap.create<PageProgressGroups, boolean>(false),
  ) {}

  saveCall(pageCom: PageCommunication, http: HttpClient) {
    return http.post(pageCom.operationUrl('save_page_progress'), this.toJson(), {});
  }
  setVerifyCall(pageCom: PageCommunication, http: HttpClient, b: boolean = true) {
    if (b && !this.verifyAllowed()) { return; }
    const prev = this.isVerified();
    if (prev === b) { return; }
    this.setLocked(PageProgressGroups.Verified, b);
    const url = pageCom.content_url('page_progress/verify');
    const obs = b ? http.put(url, {}) : http.delete(url);
    return obs.pipe(catchError(err => {
        this.setLocked(PageProgressGroups.Verified, prev);
        return throwError(err);
      }
    ));
  }

  getLocked(group: PageProgressGroups) { return this.locked.get(group); }
  setLocked(group: PageProgressGroups, value: boolean) { this.locked.set(group, value); this.lockedChanged.emit({group, value}); }
  toggleLocked(group: PageProgressGroups) { this.setLocked(group, !this.locked.get(group)); }
  verifyAllowed() { return this.isFinished(); }


  equals(o: PageEditingProgress): boolean { return equalMaps(this, o); }


  isFinished(): boolean {
    return [PageProgressGroups.StaffLines, PageProgressGroups.Layout, PageProgressGroups.Symbols, PageProgressGroups.Text].map(
      g => this.getLocked(g)
    ).reduce(((previousValue, currentValue) => previousValue && currentValue));
  }
  isVerified() { return this.getLocked(PageProgressGroups.Verified); }
  inProgress(): boolean {
    return [PageProgressGroups.StaffLines, PageProgressGroups.Layout, PageProgressGroups.Symbols, PageProgressGroups.Text].map(
      g => this.getLocked(g)
    ).reduce((previousValue, currentValue) => previousValue || currentValue);
  }
}
