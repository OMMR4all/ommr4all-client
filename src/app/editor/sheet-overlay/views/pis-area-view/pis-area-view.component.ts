import {ChangeDetectorRef, Component, Input, OnChanges, OnInit, inject} from '@angular/core';
import {PageLine} from '../../../../data-types/page/pageLine';
import {EditorTool} from '../../editor-tools/editor-tool';
import {computePisBands, PisBand} from './pis-bands';

/**
 * Draws the area each position in staff claims, i.e. where a symbol counts as sitting on a staff
 * line and where it counts as sitting in the space between two of them. The geometry lives in
 * pis-bands.ts.
 */
@Component({
  selector: '[app-pis-area-view]',
  templateUrl: './pis-area-view.component.html',
  styleUrls: ['./pis-area-view.component.scss'],
  standalone: false
})
export class PisAreaViewComponent implements OnInit, OnChanges {
  private changeDetector = inject(ChangeDetectorRef);

  @Input() line: PageLine;
  @Input() editorTool: EditorTool;

  bands: PisBand[] = [];

  constructor() {
    this.changeDetector.detach();
  }

  ngOnInit() {
    this.redraw();
  }

  ngOnChanges(): void {
    this.redraw();
  }

  redraw() {
    this.bands = computePisBands(this.line);
    this.changeDetector.detectChanges();
  }
}
