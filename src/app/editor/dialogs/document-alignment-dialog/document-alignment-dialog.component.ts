import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {ActionsService} from '../../actions/actions.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Document} from '../../../book-documents';
import {
  AlgorithmGroups,
  AlgorithmPredictorParams, AlgorithmRequest,
  AlgorithmTypes
} from '../../../book-view/book-step/algorithm-predictor-params';
import {ModelMeta} from '../../../data-types/models';
import {
  ModelForBookSelectionComponent
} from '../../../common/algorithm-steps/model-for-book-selection/model-for-book-selection.component';
import {BookCommunication, PageCommunication} from '../../../data-types/communication';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookMeta} from '../../../book-list.service';
import {HttpClient} from '@angular/common/http';
import {
  AlgorithmPredictorSettingsComponent
} from '../../../common/algorithm-steps/algorithm-predictor-settings/algorithm-predictor-settings.component';
import {TaskWorker} from '../../task';

export class DocumentPasteToolData {
  document: Document;
  bookCom: BookCommunication;
}

@Component({
  selector: 'app-document-alignment-dialog',
  templateUrl: './document-alignment-dialog.component.html',
  styleUrls: ['./document-alignment-dialog.component.scss']
})


export class DocumentAlignmentDialogComponent implements OnInit {
  private readonly selectedAlgorithmForGroup = new Map<AlgorithmGroups, AlgorithmTypes>([
    [AlgorithmGroups.StaffLines, AlgorithmTypes.StaffLinesPC],
    [AlgorithmGroups.Symbols, AlgorithmTypes.SymbolsPC],
    [AlgorithmGroups.Text, AlgorithmTypes.TextCalamari],
    [AlgorithmGroups.Syllables, AlgorithmTypes.SyllablesFromText]
  ]);
  rawText: '';
  readonly AT = AlgorithmTypes;
  readonly AG = AlgorithmGroups;
  private readonly _bookMeta = new BehaviorSubject<BookMeta>(new BookMeta());
  private readonly subscriptions = new Subscription();
  task: TaskWorker;
  private _selectedModelMetas: Map<AlgorithmGroups, {model: ModelMeta, select: ModelForBookSelectionComponent}> = null;
  @ViewChild(AlgorithmPredictorSettingsComponent) predictorSettings: AlgorithmPredictorSettingsComponent;

  constructor(
    private http: HttpClient,
    public actions: ActionsService,
    private dialogRef: MatDialogRef<DocumentAlignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentPasteToolData,
  ) {

    this.subscriptions.add(
      this.http.get<BookMeta>(this.data.bookCom.meta()).subscribe(res => this._bookMeta.next(BookMeta.fromJson(res))));
  }
  get bookMeta() { return this._bookMeta.getValue(); }

  ngOnInit(): void {

  }
  align(r: any = false) {
    this.run();
  }
  ngOnDestroy(): void {
    this.stop();
    this.subscriptions.unsubscribe();
  }

  cancel() {
    if (!this.task) { return; }
    this.task.cancelTask().then(() => {
      this.stop();
    }).catch(() => {
      this.stop();
    });
  }

  close() {
    this.stop();
    this.dialogRef.close();
  }

  private stop() {
    if (this.task) {
      this.task.stopStatusPoller();
      this.task = undefined;
    }
  }

  run() {
    const requestBody = new AlgorithmRequest();

    const pageCom: PageCommunication = new PageCommunication(this.data.bookCom, this.data.document.pages_names[0]);
    const bookCom: BookCommunication = this.data.bookCom;
    this.predictorSettings.params.documentText = this.rawText;
    this.predictorSettings.params.documentId = this.data.document.doc_id;

    requestBody.params = this.predictorSettings.params;
    requestBody.store_to_pcgts = true;
    //task = new TaskWorker(e.type, this.http, this.book, requestBody);

    this.task = new TaskWorker(this.AT.DOCUMENTALIGNMENT, this.http, bookCom);
    this.task.putTask(null, requestBody);
    this.task.taskFinished.subscribe(res => this.onTaskFinished(res));
  }

  private onTaskFinished(res) {
    this.close();
  }
}
