import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, AfterContentChecked, OnChanges, inject } from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {PageLine} from '../../../../data-types/page/pageLine';
import {EditorTool} from '../../editor-tools/editor-tool';

@Component({
    selector: 'app-document-view',    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DocumentViewComponent implements OnInit, AfterContentChecked, OnChanges {
  changeDetector = inject(ChangeDetectorRef);
  private sheetOverlayService = inject(SheetOverlayService);

  @Input() line: PageLine;
  @Input() editorTool: EditorTool;
  constructor() {
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
