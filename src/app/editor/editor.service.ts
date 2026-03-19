import {EventEmitter, Injectable, OnDestroy, Output, Directive, inject, NgZone} from '@angular/core';
import {BehaviorSubject, forkJoin, Subscription} from 'rxjs';
import {ToolBarStateService} from './tool-bar/tool-bar-state.service';
import {BookCommunication, PageCommunication} from '../data-types/communication';
import {PcGts} from '../data-types/page/pcgts';
import {ActionsService} from './actions/actions.service';
import {ActionStatistics} from './statistics/action-statistics';
import {PageEditingProgress} from '../data-types/page-editing-progress';
import { HttpClient } from '@angular/common/http';
import {ServerStateService} from '../server-state/server-state.service';
import {BookMeta} from '../book-list.service';
import {AlgorithmGroups} from '../book-view/book-step/algorithm-predictor-params';
import {PredictData} from './dialogs/predict-dialog/predict-dialog.component';
import {BookPermissionFlag} from '../data-types/permissions';
import {AnnotationStruct} from '../data-types/structs';
import {ApiError, apiErrorFromHttpErrorResponse} from '../utils/api-error';
import {BookDocuments, Document} from '../book-documents';
import {BlockType} from "../data-types/page/definitions";
import {PageLine} from "../data-types/page/pageLine";
import {ActionType} from "./actions/action-types";
import {Sentence} from "../data-types/page/sentence";
import { take } from 'rxjs/operators';

export class PageState {
  constructor(
    public readonly zero: boolean,
    public readonly pageCom: PageCommunication,
    public readonly pcgts: PcGts,
    public readonly progress: PageEditingProgress,
    public readonly statistics: ActionStatistics,
    public readonly bookMeta: BookMeta,
    public edit = false,
    public saved = true,
  ) {}

  get bookCom() { return this.pageCom.book; }
}
export class DocumentState {
  constructor(
    public  readonly zero: boolean,
    public readonly bookCom: BookCommunication,
    public bookDocumentState: BookDocuments,

  ) {
  }
}

export interface SyllableMatchResult {
  xPos: number;
  syllable: {id: string, text: string, connection: string, dropCapitalLength: number};
}

export interface SyllablePredictionResult {
  syllables: SyllableMatchResult[];
}

export interface PredictedEvent {
  pageState: PageState;
  group: AlgorithmGroups;
  result: {
    // staff lines
    staffs: any,

    // symbols
    musicLines: any[],
    debugSymbols: any[]

    // layout
    blocks: any,

    // text
    textLines: any[],

    // syllables
    annotations: AnnotationStruct;
  };
  data: PredictData;
}

@Directive()
@Injectable({
  providedIn: 'root'
})
export class EditorService implements OnDestroy {
  private http = inject(HttpClient);
  private toolbarStateService = inject(ToolBarStateService);
  private actions = inject(ActionsService);
  private serverState = inject(ServerStateService);
  private ngZone = inject(NgZone);

  private _subscriptions = new Subscription();
  @Output() pageSaved = new EventEmitter<PageState>();
  @Output() currentPageChanged = new EventEmitter<PcGts>();
  @Output() predicted = new EventEmitter<PredictedEvent>();
  private _pageState = new BehaviorSubject<PageState>(null);
  private _automaticStaffsLoading = false;
  private _automaticSymbolsLoading = false;
  private _apiError: ApiError;
  private _isSaving = false;
  private _lastPageCommunication: PageCommunication = null;
  private _documentState = new DocumentState(true, null, null);
  private _resetState() {
    const progress = new PageEditingProgress();
    let stats: ActionStatistics;
    this.ngZone.runOutsideAngular(() => {
      stats = new ActionStatistics(this.toolbarStateService.currentEditorTool, progress);
    });
    this._pageState.next(
      new PageState(
        true,
        new PageCommunication(new BookCommunication(''), ''),
        new PcGts(),
        progress,
        stats,
        new BookMeta(),
      )
    );
  }

  constructor() {
    const serverState = this.serverState;

    this._resetState();
    this._subscriptions.add(this.actions.actionCalled.subscribe(type => {
      if (this.actionStatistics) { this.actionStatistics.actionCalled(type); }
    }));
    this._subscriptions.add(this.toolbarStateService.editorToolChanged.subscribe(tool => {
      if (this.actionStatistics) { this.actionStatistics.editorToolActivated(tool.prev, tool.next); }
    }));
    this._subscriptions.add(serverState.connectedToServer.subscribe(() => {
      if (this.pageStateVal.zero && this._lastPageCommunication) {
        this.loadBookDocumentState(this._lastPageCommunication.book.book);
        this.load(this._lastPageCommunication.book.book, this._lastPageCommunication.page);
      }
    }));
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  select(book: string, page: string) {
    const oldPageCom = this._lastPageCommunication; // Remember the page we are leaving
    const hadEditLock = this.pcgtsEditAquired;

    this.save(() => {
      if (oldPageCom && hadEditLock) {
        this.releaseLockSafely(oldPageCom);
      }

      this.load(book, page);
    });
  }

  get pageStateObs() { return this._pageState.asObservable(); }
  get pageStateVal() { return this._pageState.getValue(); }
  get pcgts() { return this.pageStateVal.pcgts; }
  get pageCom(): PageCommunication { return this.pageStateVal.pageCom; }
  get bookCom(): BookCommunication { return this.pageStateVal.bookCom; }
  get bookMeta(): BookMeta { return this.pageStateVal.bookMeta; }
  get width() { return this.pageStateVal.pcgts.page.imageWidth; }
  get height() { return this.pageStateVal.pcgts.page.imageHeight; }
  get apiError() { return this._apiError; }
  get pageLoading() { return this.pageStateVal.zero; }
  get isLoading() { return this._automaticStaffsLoading || this._automaticSymbolsLoading || this.pageLoading; }
  get actionStatistics() { return this.pageStateVal.statistics; }
  get pageEditingProgress() { return this.pageStateVal.progress; }
  get pcgtsEditAquired() { return this.pageStateVal.edit; }

  dumps(): string {
    if (!this.pageStateVal) { return ''; }
    return JSON.stringify(this.pageStateVal.pcgts.toJson(), null, 2);
  }
  loadBookDocumentState(book: string) {
    const bookCom = new BookCommunication(book);
    this.http.get(bookCom.documentsUrl()).subscribe(doc => {
      const docs = BookDocuments.fromJson(doc);
      this._documentState = new DocumentState(false, bookCom, docs);
    });
  }

  load(book: string, page: string) {
    this._resetState();
    this.actions.reset();
    const pageCom = new PageCommunication(new BookCommunication(book), page);
    this._lastPageCommunication = pageCom;
    forkJoin([
      this.http.get(pageCom.content_url('pcgts')),
      this.http.get(pageCom.content_url('page_progress')),
      this.http.get(pageCom.book.meta()),
    ]).subscribe(
      r => {
        const progress = PageEditingProgress.fromJson(r[1]);
        const nextPageState = (actionStats: ActionStatistics = null) => {
          if (!actionStats) {
            this.ngZone.runOutsideAngular(() => {
              actionStats = new ActionStatistics(this.toolbarStateService.currentEditorTool, progress);
            });
          }
          setTimeout(() => {
            this._pageState.next(new PageState(
              false,
              pageCom,
              PcGts.fromJson(r[0]),
              progress,
              actionStats,
              BookMeta.copy(r[2] as BookMeta),
            ));
          }, 0);
        };
        if (this.bookMeta.hasPermission(BookPermissionFlag.RightsMaintainer)) {
          this.http.get(pageCom.content_url('statistics')).subscribe(
            stats => {
              let actionStats: ActionStatistics;
              this.ngZone.runOutsideAngular(() => {
                actionStats = ActionStatistics.fromJson(stats, this.toolbarStateService.currentEditorTool, progress);
              });
              nextPageState(actionStats);
            },
            error => {
              this._apiError = apiErrorFromHttpErrorResponse(error);
            }
          );
        } else {
          nextPageState();
        }
      },
      error => { this._apiError = apiErrorFromHttpErrorResponse(error); }
    );
  }
  update_pcgts_annotations() {
    const currentPagestate = this.pageStateVal;
    this.http.get(currentPagestate.pageCom.content_url('pcgts')).subscribe(r => {
      const pcgts = PcGts.fromJson(r);
      const lyrics = pcgts.page.allTextLinesWithType(BlockType.Lyrics);
      this.actions.startAction(ActionType.LyricsEdit);

      lyrics.forEach(line => {
        const currentLine: PageLine = currentPagestate.pcgts.page.textLineById(line.id);
        if (currentLine) {
          const newSentence = new Sentence(Sentence.textToSyllables(line.sentence.text));
          this.actions.changeLyrics(currentLine, newSentence);

        }
        });
      this.actions.finishAction();
      });
  }
  save(onSaved: (ps: PageState) => void = null) {
    const state = this.pageStateVal;

    if (this._isSaving) {
      console.log('Save already in progress, skipping duplicate request.');
      if (onSaved) {
        onSaved(state);
      }
      return;
    }

    if (!state || state.zero || !this.pcgtsEditAquired) {
      if (onSaved) {
        onSaved(state);
      }
      return;
    }

    if (!state.bookMeta.hasPermission(BookPermissionFlag.Save)) {
      return;
    }

    state.saved = false;
    state.pcgts.clean();
    state.pcgts.refreshIds();

    this._isSaving = true;

    forkJoin([
      this.http.put(state.pageCom.content_url('statistics'), state.statistics.toJson(), {}),
      this.http.put(state.pageCom.content_url('pcgts'), state.pcgts.toJson(), {}),
      state.progress.saveCall(state.pageCom, this.http),
    ]).subscribe({
      next: () => {
        this._isSaving = false;
        state.saved = true;
        this.pageSaved.emit(state);
        console.log('saved');
        if (onSaved) {
          onSaved(state);
        }
      },
      error: (err) => {
        this._isSaving = false;
        console.error('Save failed', err);
        state.saved = false;
      }
    });
  }

  releaseLockSafely(pageCom: PageCommunication) {
    if (!pageCom) return;
    if (this.pageStateVal && this.pageStateVal.pageCom.page === pageCom.page) {
      this.pageStateVal.edit = false;
    }
    if (this._isSaving) {
      this.pageSaved.pipe(take(1)).subscribe(() => {
        this.http.delete(pageCom.lock_url(), {}).subscribe();
      });
    } else {
      this.http.delete(pageCom.lock_url(), {}).subscribe();
    }
  }
}
