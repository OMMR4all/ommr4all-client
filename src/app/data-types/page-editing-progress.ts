import {DefaultMap, equalMaps} from '../utils/data-structures';
import {enumMapToObj, objIntoEnumMap, valuesOfIntEnum} from '../utils/converting';
import {EventEmitter} from '@angular/core';
import {PageCommunication} from './communication';
import {HttpClient} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';

export enum PageProgressGroups {
  StaffLines,
  Layout,
  Symbols,
  Text,
}

export const valuesOfPageProgressGroups: PageProgressGroups[] = valuesOfIntEnum(PageProgressGroups);

export class PageEditingProgress {
  readonly lockedChanged = new EventEmitter<{group: PageProgressGroups, value: boolean}>();

  static fromJson(json) {
    const pp = new PageEditingProgress();
    pp.verified = json.verified;
    objIntoEnumMap(json.locked, pp.locked, PageProgressGroups);
    return pp;
  }
  toJson() {
    return {
      locked: enumMapToObj(this.locked, PageProgressGroups),
      verified: this.verified,
    };
  }
  constructor(
    private locked = DefaultMap.create<PageProgressGroups, boolean>(false),
    private verified = false,
  ) {}

  saveCall(pageCom: PageCommunication, http: HttpClient): Observable<object> {
    return http.post(pageCom.operationUrl('save_page_progress'), this.toJson(), {});
  }
  setVerifyCall(pageCom: PageCommunication, http: HttpClient, b: boolean = true) {
    if (b && !this.verifyAllowed()) { return; }
    const prev = this.isVerified();
    if (prev === b) { return; }
    this.verified = b;
    const url = pageCom.content_url('page_progress/verify');
    const obs = b ? http.put(url, {}) : http.delete(url);
    return obs.pipe(catchError(err => {
      this.verified = prev;
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
    return valuesOfPageProgressGroups.map(g => this.getLocked(g))
      .reduce(((previousValue, currentValue) => previousValue && currentValue));
  }
  isVerified() { return this.verified; }
  inProgress(): boolean {
    return valuesOfPageProgressGroups.map(g => this.getLocked(g))
      .reduce((previousValue, currentValue) => previousValue || currentValue);
  }
}
