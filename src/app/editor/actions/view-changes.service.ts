import {EventEmitter, Injectable} from '@angular/core';
import {ChangedView, RequestChangedViewElements} from './changed-view-elements';

@Injectable({
  providedIn: 'root'
})
export class ViewChangesService {
  changed = new EventEmitter<ChangedView>();

  constructor() { }

  request(changes: RequestChangedViewElements) {
    const c = new ChangedView();
    changes.forEach(l => c.add(l));
    this.handle(c);
  }

  handle(changes: ChangedView) {
    this.changed.emit(changes);
  }

}
