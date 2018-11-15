import {Component, OnInit} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorTool} from '../editor-tool';
import {TextEditorService} from './text-editor.service';
import {TextLine} from '../../../data-types/page/text-line';
import {TextEquivContainer} from '../../../data-types/page/definitions';
import {TextRegion, TextRegionType} from '../../../data-types/page/text-region';
import {EditorService} from '../../../editor/editor.service';
import {EditorTools, ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';
import {CommandChangeProperty} from '../../../editor/undo/util-commands';
import {ActionsService} from '../../../editor/actions/actions.service';
import {ActionType} from '../../../editor/actions/action-types';

const machina: any = require('machina');

@Component({
  selector: '[app-text-editor]',                  // tslint:disable-line component-selector
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.css']
})
export class TextEditorComponent extends EditorTool implements OnInit {
  get currentTextEquiv() { return this.textEditorService.currentTextEquiv; }
  get currentContainer() { return this.textEditorService.currentTextEquivContainer; }
  set currentContainer(te: TextEquivContainer) { this.textEditorService.currentTextEquivContainer = te; }

  get size() { return this.sheetOverlayService.localToGlobalSize(10); }

  get visible() { return this.toolBarService.currentEditorTool === EditorTools.Lyrics; }

  get readingOrder() { return this.editorService.pcgts.page.readingOrder; }

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private textEditorService: TextEditorService,
    public editorService: EditorService,
    private toolBarService: ToolBarStateService,
    private actions: ActionsService,
  ) {
    super(sheetOverlayService);

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
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
  }

  onMouseDown(event: MouseEvent) {
  }

  onMouseUp(event: MouseEvent) {
  }

  onMouseMove(event: MouseEvent) {
  }

  onTextLineMouseUp(event: MouseEvent, textLine: TextLine) {
    if (this.state === 'active') {
      this.actions.startAction(ActionType.LyricsDeselect);
      this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, textLine));
      this.actions.finishAction();
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.onMouseUp(event);
    }
  }

  onTextRegionMouseUp(event: MouseEvent, textRegion: TextRegion) {
    if (this.state === 'active') {
      if (textRegion.type === TextRegionType.DropCapital) {
        this.actions.startAction(ActionType.LyricsDeselect);
        this.actions.run(new CommandChangeProperty(this, 'currentContainer', this.currentContainer, textRegion));
        this.actions.finishAction();
        event.preventDefault();
        event.stopPropagation();
      }
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
        event.stopPropagation();
      } else if (event.code === 'Tab') {
        if (event.shiftKey) {
          this.onSelectPrevious();
        } else {
          this.onSelectNext();
        }
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
}
