import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Annotations, Connection, SyllableConnector} from '../../../../data-types/page/annotations';
import {EditorTool} from '../../editor-tools/editor-tool';

@Component({
  selector: '[app-annotations-view]',  // tslint:disable-line component-selector
  templateUrl: './annotations-view.component.html',
  styleUrls: ['./annotations-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationsViewComponent implements OnInit, OnChanges {
  @Input() annotations: Annotations;
  @Input() editorTool: EditorTool;

  constructor(
    private changeDetector: ChangeDetectorRef,
  ) {
    changeDetector.detach();
  }

  ngOnInit() {
    this.redraw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.redraw();
  }

  redraw() {
    this.changeDetector.detectChanges();
  }

  onSyllableMouseDown(event: MouseEvent, syllable: SyllableConnector) {
    if (event.button !== 0) { return; }
    this.editorTool.onSyllableMouseDown(event, syllable);
  }

  onSyllableMouseUp(event: MouseEvent, connection: Connection, syllable: SyllableConnector) {
    if (event.button !== 0) { return; }
    this.editorTool.onSyllableMouseUp(event, connection, syllable);
  }
}
