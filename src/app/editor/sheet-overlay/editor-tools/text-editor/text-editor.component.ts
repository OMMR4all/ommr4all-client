import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
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
import {Rect} from '../../../../geometry/geometry';
import {Subscription} from 'rxjs';
import {TextEditorOverlayComponent} from './text-editor-overlay/text-editor-overlay.component';
import {ReadingOrderContextMenuComponent} from '../../context-menus/reading-order-context-menu/reading-order-context-menu.component';
import {UserCommentHolder} from '../../../../data-types/page/userComment';

const machina: any = require('machina');

@Component({
  selector: '[app-text-editor]',                  // tslint:disable-line component-selector
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorComponent extends EditorTool implements OnInit, OnDestroy, AfterViewInit {
  @Input() textEditorOverlay: TextEditorOverlayComponent;
  @Input() readingOrderContextMenu: ReadingOrderContextMenuComponent;
  private _subscriptions = new Subscription();
  public currentLine: PageLine = null;
  public get currentAABB() {
    return this.currentLine ? this.currentLine.AABB : new Rect();
  }
  public get mode() {
    if (!this.currentLine) { return; }
    const p = this.currentLine.getBlock();
    return p.type;
  }

  get selectedCommentHolder(): UserCommentHolder { return this.currentLine; }

  get visible() { return this.toolBarService.currentEditorTool === EditorTools.Lyrics; }

  get readingOrder() { return this.editorService.pcgts.page.readingOrder; }

  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private textEditorService: TextEditorService,
    public editorService: EditorService,
    private toolBarService: ToolBarStateService,
    private actions: ActionsService,
    protected viewChanges: ViewChangesService,
    private changeDetector: ChangeDetectorRef,
  ) {
    super(sheetOverlayService, viewChanges,
      new ViewSettings(true, false, true, true, true,
        true),
    );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
        },
        active: {
          _onEnter: () => {
            if (this.currentLine && !this.currentLine.getBlock()) {
              this.currentLine = null;
            }
          },
          idle: 'idle',
          deactivate: 'idle',
          cancel: 'active',
        }
      }
    });
    textEditorService.states = this._states;
  }

  ngOnInit() {
    this._subscriptions.add(this.viewChanges.changed.subscribe((vc) => {
      if (vc.checkChangesLine.has(this.currentLine)) {
        this.changeDetector.markForCheck();
      }
    }));
    this._subscriptions.add(this.toolBarService.runClearAllTexts.subscribe(() => {
      this.actions.startAction(ActionType.LyricsClean);
      this.actions.clearAllTexts(this.editorService.pcgts.page);
      this.actions.finishAction();
    }));
    this._subscriptions.add(this.toolBarService.runAutoReadingOrder.subscribe(() => {
      this.actions.startAction(ActionType.ReadingOrderAuto);
      this.actions.updateReadingOrder(this.editorService.pcgts.page, true);
      this.actions.finishAction();
    }));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  ngAfterViewInit(): void {
  }

  onSelectNext(): void {
    this.actions.startAction(ActionType.LyricsNextTextContainer);
    if (!this.currentLine) {
      this.actions.run(new CommandChangeProperty(this, 'currentLine', this.currentLine, this.readingOrder.first()));
    } else {
      this.actions.run(new CommandChangeProperty(this, 'currentLine', this.currentLine, this.readingOrder.next(this.currentLine)));
    }
    this.actions.finishAction();
  }

  onSelectPrevious(): void {
    this.actions.startAction(ActionType.LyricsPrevTextContainer);
    if (!this.currentLine) {
      this.actions.run(new CommandChangeProperty(this, 'currentLine', this.currentLine, this.readingOrder.last()));
    } else {
      this.actions.run(new CommandChangeProperty(this, 'currentLine', this.currentLine, this.readingOrder.prev(this.currentLine)));
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
      this.actions.run(new CommandChangeProperty(this, 'currentLine', this.currentLine, line));
      this.actions.finishAction();
      event.preventDefault();
    } else {
      this.onMouseUp(event);
    }
  }

  onLineContextMenu(event: MouseEvent, line: PageLine) {
    this.readingOrderContextMenu.open(event.clientX, event.clientY, line.block);
  }

  onKeyup(event: KeyboardEvent) {
    if (this.state === 'active') {
      if (event.code === 'Escape') {
        this.actions.startAction(ActionType.LyricsDeselect);
        this.actions.run(new CommandChangeProperty(this, 'currentLine', this.currentLine, null));
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
