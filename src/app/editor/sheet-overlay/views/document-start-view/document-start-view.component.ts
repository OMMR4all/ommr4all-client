import {ChangeDetectorRef, Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {PageLine} from "../../../../data-types/page/pageLine";
import {EditorTool} from "../../editor-tools/editor-tool";
import {SheetOverlayService} from "../../sheet-overlay.service";

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[app-document-start-view]',
  templateUrl: './document-start-view.component.html',
  styleUrls: ['./document-start-view.component.scss']
})
export class DocumentStartViewComponent implements OnInit {

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
