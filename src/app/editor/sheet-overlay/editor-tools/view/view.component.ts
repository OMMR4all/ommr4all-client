import {ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {EditorTool} from '../editor-tool';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {ViewSettings} from '../../views/view';
import {ViewChangesService} from '../../../actions/view-changes.service';

@Component({
  selector: '[app-view-editor-tool]',  // tslint:disable-line component-selector
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent extends EditorTool implements OnInit {
  constructor(
    protected sheetOverlayService: SheetOverlayService,
    protected viewChanges: ViewChangesService,
    protected changeDetector: ChangeDetectorRef,
  ) {
    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(
        true,
        false,
        true,
        true,
        true,
        false,
        true,
        true,
        true,
        false,
        true,
        ),
    );
  }

  ngOnInit() {
  }

}
