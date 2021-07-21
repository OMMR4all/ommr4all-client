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
import {PolyLine, Rect} from '../../../../geometry/geometry';
import {Subscription} from 'rxjs';
import {TextEditorOverlayComponent} from './text-editor-overlay/text-editor-overlay.component';
import {ReadingOrderContextMenuComponent} from '../../context-menus/reading-order-context-menu/reading-order-context-menu.component';
import {UserCommentHolder} from '../../../../data-types/page/userComment';
import {Options, ShortcutService} from '../../../shortcut-overlay/shortcut.service';
import {filter} from "rxjs/operators";
import {BookDocuments, Document} from "../../../../book-documents";
import {HttpClient} from "@angular/common/http";
import {BookDocumentsService} from "../../../../book-documents.service";
import {TaskWorker} from "../../../task";
import {AlgorithmRequest, AlgorithmTypes} from "../../../../book-view/book-step/algorithm-predictor-params";
import {Sentence} from "../../../../data-types/page/sentence";
import {ConfirmDialogComponent} from "../../../../common/confirm-dialog/confirm-dialog.component";
import {MatDialog} from "@angular/material";
import {
  LyricsSelectTextData,
  LyricsSelectTextDialogComponent
} from "../../../dialogs/lyrics-select-text-dialog/lyrics-select-text-dialog.component";

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
  public docs: BookDocuments = null;
  public get currentAABB() {
    return this.currentLine ? this.currentLine.AABB : new Rect();
  }
  public get mode() {
    if (!this.currentLine) { return; }
    const p = this.currentLine.getBlock();
    return p.type;
  }
  task = new TaskWorker(
    AlgorithmTypes.TextDocuments,
    this.http,
    this.sheetOverlayService.editorService.pageStateVal.pageCom,
  );
  get selectedCommentHolder(): UserCommentHolder { return this.currentLine; }

  get visible() { return this.toolBarService.currentEditorTool === EditorTools.Lyrics; }

  get readingOrder() { return this.editorService.pcgts.page.readingOrder; }
  readonly tooltips: Array<Partial<Options>> = [
    { keys: this.hotkeys.symbols().mouse1, description: 'Select text region', group: EditorTools.Syllables},

    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().tab, description: 'Select next text', group: EditorTools.Syllables},
    // tslint:disable-next-line:max-line-length
    { keys: this.hotkeys.symbols().shift + ' + ' + this.hotkeys.symbols().tab, description: 'Select previous text', group: EditorTools.Syllables},
    { keys: this.hotkeys.symbols().escape, description: 'Cancel selection', group: EditorTools.Syllables},
    { keys: this.hotkeys.symbols().mouse2, description: 'Open context menu on text region', group: EditorTools.Syllables},


  ];
  constructor(
    protected sheetOverlayService: SheetOverlayService,
    private textEditorService: TextEditorService,
    public editorService: EditorService,
    private http: HttpClient,
    private toolBarService: ToolBarStateService,
    private documentService: BookDocumentsService,
    private actions: ActionsService,
    protected viewChanges: ViewChangesService,
    protected changeDetector: ChangeDetectorRef,
    private hotkeys: ShortcutService,
    private dialog: MatDialog,
  ) {
    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(true, false, true, true, true,
        true),
    );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => {
            this.tooltips.forEach(obj => {this.hotkeys.deleteShortcut(obj); });
          }
        },
        active: {
          _onEnter: () => {
            if (this.currentLine && !this.currentLine.getBlock()) {
              this.currentLine = null;
            }
            this.tooltips.forEach(obj => {this.hotkeys.addShortcut(obj); });
          },
          idle: 'idle',
          deactivate: 'idle',
          cancel: 'active',
        },
        waitingForResponse: {
          cancel: 'active',
          error: 'active',
          dataReceived: (args: Array<string>) => {
            this.states.transition('active');
            const dialogData = new LyricsSelectTextData();
            dialogData.docs = args;
            const dialogRef = this.dialog.open(LyricsSelectTextDialogComponent, {
              maxWidth: '800px',
              data: dialogData
            });
          }
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
    this._subscriptions.add(this.toolBarService.runClearAllSyllableConnections.subscribe(() => {
      this.actions.startAction(ActionType.SyllablesClearConnections);
      this.actions.clearAllAnnotations(this.editorService.pcgts.page.annotations);
      this.actions.finishAction();
    }));
    this._subscriptions.add(this.toolBarService.runAutoReadingOrder.subscribe(() => {
      this.actions.startAction(ActionType.ReadingOrderAuto);
      this.actions.updateReadingOrder(this.editorService.pcgts.page, true);
      this.actions.finishAction();
    }));
    this._subscriptions.add(this.toolBarService.runSimilarDocumentTexts.subscribe(() => {
      if (this.currentLine != null && this.currentLine.sentence.getDocumentStart) {
        this.states.transition('waitingForResponse');
        const doc = this.docs.database_documents.getDocumentbyLineidAndPage(this.currentLine.id, this.editorService.pageStateVal.pageCom.page);

        this._requestExtract(doc);        //Todo
      }
    }));
    this._subscriptions.add(this.documentService.documentStateObs.subscribe(r  => {
      this.docs = r;

    }));
    this._subscriptions.add(
      this.task.taskFinished.subscribe(res => this._taskFinished(res))
    );
  }
  private _requestExtract(doc: Document) {
    const requestBody = new AlgorithmRequest();
    requestBody.pcgts = this.sheetOverlayService.editorService.pageStateVal.pcgts.toJson();
    requestBody.params.documentId = doc.doc_id;
    this.task.putTask(null, requestBody);
  }
  private _taskFinished(res: {similarText: Array<string>}) {
    console.log(res.similarText);
    this.states.handle('dataReceived', res.similarText);
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
      this.actions.startAction(ActionType.LyricsSelect);
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
