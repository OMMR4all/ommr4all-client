import {Component, OnInit} from '@angular/core';
import {SheetOverlayService} from '../../sheet-overlay.service';
import {EditorTool} from '../editor-tool';
import {TextEditorMode, TextEditorService} from './text-editor.service';
import {TextLine} from '../../../data-types/page/text-line';
import {TextEquiv} from '../../../data-types/page/text-equiv';
import {TextEquivContainer, TextEquivIndex} from '../../../data-types/page/definitions';
import {TextRegion, TextRegionType} from '../../../data-types/page/text-region';
import {EditorService} from '../../../editor/editor.service';
import {EditorTools, ToolBarStateService} from '../../../tool-bar/tool-bar-state.service';

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

  set mode(m: TextEditorMode) { this.textEditorService.mode = m; }
  get size() { return this.sheetOverlayService.localToGlobalSize(10); }

  get visible() { return this.toolBarService.currentEditorTool === EditorTools.Lyrics; }

  get readingOrder() { return this.editorService.pcgts.page.readingOrder; }

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private textEditorService: TextEditorService,
    public editorService: EditorService,
    private toolBarService: ToolBarStateService,
  ) {
    super(sheetOverlayService);

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => {
            this.currentContainer = null;
          },
        },
        active: {
          deactivate: 'idle',

        }
      }
    });
    textEditorService.states = this._states;
  }

  ngOnInit() {
  }

  onSelectNext() {
    if (!this.currentContainer) { return this.readingOrder.first(); }
    this.currentContainer = this.readingOrder.next(this.currentContainer);
  }

  onSelectPrevious() {
    if (!this.currentContainer) { return this.readingOrder.last(); }
    this.currentContainer = this.readingOrder.prev(this.currentContainer);
  }

  onMouseDown(event: MouseEvent) {
  }

  onMouseUp(event: MouseEvent) {
  }

  onMouseMove(event: MouseEvent) {
  }

  onTextLineMouseUp(event: MouseEvent, textLine: TextLine) {
    if (this.state === 'active') {
      this.textEditorService.currentTextEquivContainer = textLine;
      const trType = textLine.textRegion.type;
      if (trType === TextRegionType.DropCapital) {
        this.mode = TextEditorMode.DropCapital;
      } else if (trType === TextRegionType.Lyrics) {
        this.mode = TextEditorMode.Lyrics;
      } else {
        this.mode = TextEditorMode.Text;
      }

      event.preventDefault();
      event.stopPropagation();
    } else {
      this.onMouseUp(event);
    }
  }

  onTextRegionMouseUp(event: MouseEvent, textRegion: TextRegion) {
    if (this.state === 'active') {
      if (textRegion.type === TextRegionType.DropCapital) {
        this.textEditorService.currentTextEquivContainer = textRegion;
        this.mode = TextEditorMode.DropCapital;
        event.preventDefault();
        event.stopPropagation();
      }
    } else {
      this.onMouseUp(event);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (this.state === 'active') {
      if (event.code === 'Escape') {
        this.textEditorService.currentTextEquivContainer = null;
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
