import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {EditorService} from '../../../editor.service';
import {Rect} from '../../../../geometry/geometry';
import {StaffGrouperService} from './staff-grouper.service';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {SelectionBoxComponent} from '../../editors/selection-box/selection-box.component';
import {EditorTool} from '../editor-tool';
import {BlockType, EmptyRegionDefinition} from '../../../../data-types/page/definitions';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';

const machina: any = require('machina');

@Component({
  selector: '[app-staff-grouper]',  // tslint:disable-line component-selector
  templateUrl: './staff-grouper.component.html',
  styleUrls: ['./staff-grouper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffGrouperComponent extends EditorTool implements OnInit {
  @ViewChild(SelectionBoxComponent, {static: true}) selectionBox: SelectionBoxComponent;

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private toolBarStateService: ToolBarStateService,
    private editorService: EditorService,
    private staffGrouperService: StaffGrouperService,
    private actions: ActionsService,
    private changeDetector: ChangeDetectorRef,
    protected viewChanges: ViewChangesService,
  ) {
    super(sheetOverlayService, viewChanges,
      new ViewSettings(true, true, false, false, true),
    );
    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
        },
        active: {
          _onEnter: () => {
            this.selectionBox.states.transition('idle');
          },
          idle: 'idle',
          cancel: () => {
            this.selectionBox.cancel();
          }
        }
      }
    });

    this.staffGrouperService.states = this.states;
    this.states.on('transition', (data: {fromState: string, toState: string}) => {
      this.changeDetector.markForCheck();
    });
  }

  ngOnInit() {
    this.selectionBox.selectionFinished.subscribe((rect: Rect) => { this.onSelectionFinished(rect); });
  }

  onSelectionFinished(rect: Rect) {
    const staffLines = this.editorService.pcgts.page.listLinesInRect(rect);
    if (staffLines.length > 0) {
      this.actions.startAction(ActionType.StaffLinesGroup);
      const mr = this.actions.addNewBlock(this.editorService.pcgts.page, BlockType.Music);
      const staff = this.actions.addNewLine(mr);
      staffLines.forEach(line => this.actions.attachStaffLine(staff, line));
      this.actions.cleanPage(this.editorService.pcgts.page,
        EmptyRegionDefinition.HasStaffLines | EmptyRegionDefinition.HasLines,  // tslint:disable-line
        new Set<BlockType>([BlockType.Music]));
      this.actions.finishAction();
    }
  }

  onMouseDown(event: MouseEvent): boolean {
    if (this.states.state === 'active') {
      this.selectionBox.initialMouseDown(event);
      return true;
    }
    return false;
  }

  onMouseUp(event: MouseEvent) {
  }

  onMouseMove(event: MouseEvent) {
  }

  get showStaffGroupShading() { return true; }
  get showLayout() { return false; }
}
