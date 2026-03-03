import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import {SyllableEditorService} from '../syllable-editor.service';
import {Point} from '../../../../../geometry/geometry';
import {SheetOverlayService} from '../../../sheet-overlay.service';
import {Subscription} from 'rxjs';
import {ViewChangesService} from '../../../../actions/view-changes.service';
import {Syllable} from '../../../../../data-types/page/syllable';
import {filter} from 'rxjs/operators';

@Component({
    selector: 'app-syllable-editor-overlay',
    templateUrl: './syllable-editor-overlay.component.html',
    styleUrls: ['./syllable-editor-overlay.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SyllableEditorOverlayComponent implements OnInit, OnDestroy {
  private sheetOverlayService = inject(SheetOverlayService);
  private changeDetector = inject(ChangeDetectorRef);
  private viewChanges = inject(ViewChangesService);

  private _subscriptions = new Subscription();
  @Input() hide = false;
  @Input() syllable: Syllable = null;
  position = new Point(0, 0);

  get text() { return this.syllable ? this.syllable.visibleText : ''; }

  ngOnInit() {
    this._subscriptions.add(this.sheetOverlayService.mouseMove.subscribe(event => this.onMouseMove(event)));
    this._subscriptions.add(this.viewChanges.changed.pipe(filter(vc => vc.checkChangesSyllables.has(this.syllable))).subscribe(
      () => this.changeDetector.markForCheck()
    ));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  onMouseMove(event: MouseEvent) {
    this.position.x = event.clientX;
    this.position.y = event.clientY;
    this.changeDetector.markForCheck();
  }
}
