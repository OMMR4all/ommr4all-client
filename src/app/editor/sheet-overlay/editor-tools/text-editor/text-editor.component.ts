import {Component, OnInit} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorTool} from '../editor-tool';
import {TextEditorService} from './text-editor.service';
import {EditorService} from '../../../editor.service';
import {EditorTools, ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {CommandChangeProperty} from '../../../undo/util-commands';
import {ActionsService} from '../../../actions/actions.service';
import {ActionType} from '../../../actions/action-types';
import {PageLine} from '../../../../data-types/page/pageLine';
import {BlockType} from '../../../../data-types/page/definitions';
import {ViewChangesService} from '../../../actions/view-changes.service';
import {ViewSettings} from '../../views/view';

const machina: any = require('machina');

@Component({
  selector: '[app-text-editor]',                  // tslint:disable-line component-selector
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.css']
})
export class TextEditorComponent extends EditorTool implements OnInit {
  get currentTextEquiv() { return this.textEditorService.currentTextEquiv; }
  get currentContainer() { return this.textEditorService.currentTextEquivContainer; }
  set currentContainer(te: PageLine) { this.textEditorService.currentTextEquivContainer = te; }

  get size() { return this.sheetOverlayService.localToGlobalSize(10); }

  get visible() { return this.toolBarService.currentEditorTool === EditorTools.Lyrics; }

  get readingOrder() { return this.editorService.pcgts.page.readingOrder; }

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private textEditorService: TextEditorService,
    public editorService: EditorService,
    private toolBarService: ToolBarStateService,
    private actions: ActionsService,
    protected viewChanges: ViewChangesService,
  ) {
    super(sheetOverlayService, viewChanges,
      new ViewSettings(true, false, true, true, true),
    );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => {
            this.currentContainer = null;
          }
        },
        active: {
          idle: 'idle',
          deactivate: 'idle',
          cancel: 'active',
        }
      }
    });
    textEditorService.states = this._states;
  }

  ngOnInit() {
  }

  onSelectNext(): void {
    this.actions.startAction(ActionType.LyricsNextTextContainer);
    if (!this.currentContainer) {
      this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, this.readingOrder.first()));
    } else {
      this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, this.readingOrder.next(this.currentContainer)));
    }
    this.actions.finishAction();
  }

  onSelectPrevious(): void {
    this.actions.startAction(ActionType.LyricsPrevTextContainer);
    if (!this.currentContainer) {
      this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, this.readingOrder.last()));
    } else {
      this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, this.readingOrder.prev(this.currentContainer)));
    }
    this.actions.finishAction();
  }

  onMouseDown(event: MouseEvent) {
  }

  onMouseUp(event: MouseEvent) {
  }

  onMouseMove(event: MouseEvent) {
  }

  onLineMouseUp(event: MouseEvent, line: PageLine) {
    if (line.getBlock().type === BlockType.Music) { return; }
    if (this.state === 'active') {
      this.actions.startAction(ActionType.LyricsDeselect);
      this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, line));
      this.actions.finishAction();
      event.preventDefault();
    } else {
      this.onMouseUp(event);
    }
  }

  onKeyup(event: KeyboardEvent) {
    if (this.state === 'active') {
      if (event.code === 'Escape') {
        this.actions.startAction(ActionType.LyricsDeselect);
        this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, null));
        this.actions.finishAction();
        event.preventDefault();
      } else if (event.code === 'Tab') {
        if (event.shiftKey) {
          this.onSelectPrevious();
        } else {
          this.onSelectNext();
        }
        event.preventDefault();
      }
    }
  }

  receivePageMouseEvents(): boolean { return true; }
  isLineSelectable(line: PageLine): boolean { return line.getBlock().type !== BlockType.Music; }
}
