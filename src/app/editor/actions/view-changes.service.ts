import {EventEmitter, Injectable} from '@angular/core';
import {ChangedView, RequestChangedViewElements} from './changed-view-elements';
import {PageLine} from '../../data-types/page/pageLine';
import {Page} from '../../data-types/page/page';

@Injectable({
  providedIn: 'root'
})
export class ViewChangesService {
  changed = new EventEmitter<ChangedView>();

  constructor(
  ) { }

  updateAllLines(page: Page) {
    const lines = new Array<PageLine>();
    page.blocks.forEach(b => b.lines.forEach(l => lines.push(l)));
    this.request(lines);
  }

  request(changes: RequestChangedViewElements) {
    const c = new ChangedView();
    changes.forEach(l => c.add(l));
    this.handle(c);
  }

  handle(changes: ChangedView) {
    this.changed.emit(changes);
  }

}
