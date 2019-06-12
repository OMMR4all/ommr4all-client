import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList, ViewChild, ViewChildren
} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {PageState} from '../../../editor.service';
import {EditorTool} from '../../editor-tools/editor-tool';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ChangedView} from '../../../actions/changed-view-elements';
import {BlockViewComponent} from '../block-view/block-view.component';
import {arrayFromSet} from '../../../../utils/copy';
import {Page} from '../../../../data-types/page/page';
import {SyllableEditorComponent} from '../../editor-tools/syllable-editor/syllable-editor.component';
import {AnnotationsViewComponent} from '../annotations-view/annotations-view.component';
import {BlockType} from '../../../../data-types/page/definitions';
import {CommentsViewComponent} from '../comments-view/comments-view.component';

@Component({
  selector: '[app-page-view]',  // tslint:disable-line component-selector
  templateUrl: './page-view.component.html',
  styleUrls: ['./page-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageViewComponent implements OnInit, OnDestroy {
  readonly BlockType = BlockType;
  private _subscriptions = new Array<Subscription>();
  private _page: Page = null;

  @Input() pageState: Observable<PageState>;
  @Input() editorTool: EditorTool;

  @ViewChildren(BlockViewComponent) blockViews: QueryList<BlockViewComponent>;
  @ViewChild(AnnotationsViewComponent, {static: false}) annotationView: AnnotationsViewComponent;
  @ViewChild(CommentsViewComponent, {static: false}) commentsView: CommentsViewComponent;

  constructor(
    private viewChanges: ViewChangesService,
    private changeDetector: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this._subscriptions.push(
      this.viewChanges.changed.subscribe(c => this.changed(c)),
      this.pageState.subscribe((p) => {
        this._page = p.pcgts.page;
        this.changeDetector.detectChanges();
      }),
    );
  }

  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
    this._subscriptions.length = 0;
  }

  redraw() {
    this.changeDetector.detectChanges();
    if (this.annotationView) { this.annotationView.redraw(); }
    if (this.commentsView) { this.commentsView.redraw(); }
  }

  private changed(changedView: ChangedView) {
    if (!changedView) { return; }

    const blocks = arrayFromSet(changedView.checkChangesBlock);
    const lines = arrayFromSet(changedView.checkChangesLine);
    const symbols = arrayFromSet(changedView.checkChangesSymbol);
    const staffLines = arrayFromSet(changedView.checkChangesStaffLine);

    changedView.updateRequired.forEach(cv => cv.updateRequired = true);

    this.redraw();
    this._page.update();
    blocks.forEach(b => {
      const blockView = this.blockViews.find(bv => bv.block === b);
      if (blockView) {
        const lineViews = lines.filter(l => l.getBlock() === b).map(l => blockView.lineViews.find(lv => lv.line === l)).filter(l => !!l);

        blockView.changeDetector.detectChanges();
        lineViews.forEach(lv => lv.redraw());
      }
    });
  }

}
