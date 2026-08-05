import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import {Annotations, Connection, SyllableConnector} from '../../../../data-types/page/annotations';
import {EditorTool} from '../../editor-tools/editor-tool';
import {UserViewSettingsService} from '../../../../user-view-settings.service';

@Component({
    selector: '[app-annotations-view]',    templateUrl: './annotations-view.component.html',
    styleUrls: ['./annotations-view.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class AnnotationsViewComponent implements OnInit, OnChanges {
  private changeDetector = inject(ChangeDetectorRef);
  private userViewSettings = inject(UserViewSettingsService);

  @Input() annotations: Annotations;
  @Input() editorTool: EditorTool;

  /** Syllable font size: a third of the text line height, scaled by the user setting. */
  fontSize(syllable: SyllableConnector): number {
    return syllable.textLine.AABB.size.h / 3 * this.userViewSettings.appearanceNumber('text.fontSizeFactor');
  }

  constructor() {
    const changeDetector = this.changeDetector;

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
