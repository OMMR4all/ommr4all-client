import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {PageLine} from '../../../../data-types/page/pageLine';
import {EditorTool} from '../../editor-tools/editor-tool';

@Component({
  selector: 'app-document-view', // tslint:disable-line component-selector
  templateUrl: './document-view.component.html',
  styleUrls: ['./document-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class DocumentViewComponent implements OnInit {
  @Input() line: PageLine;
  @Input() editorTool: EditorTool;
  constructor(
    public changeDetector: ChangeDetectorRef,
    private sheetOverlayService: SheetOverlayService,
  ) {
    this.changeDetector.detach();
  }

  ngOnInit() {
    this.changeDetector.detectChanges();
  }

  get x() {
    return this.line.coords.aabb().bl().x;
  }

  get y() {
    return this.line.coords.aabb().bl().y;

  }
  get height() {
    return this.line.coords.aabb().bottom - this.line.coords.aabb().top;

  }
  ngAfterContentChecked(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.redraw();
  }
  redraw() {
    this.changeDetector.detectChanges();
  }
}
