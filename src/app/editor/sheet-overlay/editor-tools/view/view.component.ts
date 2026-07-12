import { ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ViewSettings} from '../../views/view';
import {ViewChangesService} from '../../../actions/view-changes.service';

@Component({
    selector: '[app-view-editor-tool]',    templateUrl: './view.component.html',
    styleUrls: ['./view.component.css'],
    standalone: false
})
export class ViewComponent extends EditorTool implements OnInit {
  protected sheetOverlayService: SheetOverlayService;
  protected viewChanges: ViewChangesService;
  protected changeDetector: ChangeDetectorRef;

  constructor() {
    const sheetOverlayService = inject(SheetOverlayService);
    const viewChanges = inject(ViewChangesService);
    const changeDetector = inject(ChangeDetectorRef);

    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        true,
        true,
        false,
        false,
        ),
    );
  
    this.sheetOverlayService = sheetOverlayService;
    this.viewChanges = viewChanges;
    this.changeDetector = changeDetector;
  }

  ngOnInit() {
  }

  requiresMoveChangeDetection(): boolean { return false; }

}
