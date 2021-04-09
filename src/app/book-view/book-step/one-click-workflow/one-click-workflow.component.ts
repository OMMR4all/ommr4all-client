import {AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {
  AlgorithmGroups,
  AlgorithmPredictorParams,
  AlgorithmRequest,
  AlgorithmTypes,
  algorithmTypesGroupMapping
} from '../algorithm-predictor-params';
import {BookCommunication, PageCommunication, PageResponse} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {TaskWorker} from '../../../editor/task';
// tslint:disable-next-line:max-line-length
import {AlgorithmPredictorSettingsComponent} from '../../../common/algorithm-steps/algorithm-predictor-settings/algorithm-predictor-settings.component';
import {HttpClient} from '@angular/common/http';
import {group} from '@angular/animations';
import {ConfirmDialogComponent, ConfirmDialogModel} from '../../../common/confirm-dialog/confirm-dialog.component';
import {WorkflowFinishDialogComponent} from '../../../editor/dialogs/workflow-finish-dialog/workflow-finish-dialog.component';
import {MatDialog} from '@angular/material';
import {Router} from '@angular/router';
import {ApiError} from '../../../utils/api-error';
// tslint:disable-next-line:component-class-suffix
class TaskData {
  private _task: TaskWorker;
  private _requestBody: AlgorithmRequest;
  constructor(  task: TaskWorker,
                requestBody: AlgorithmRequest) {
    this._task = task;
    this._requestBody = requestBody;
  }

  set task(value: TaskWorker) {
    this._task = value;
  }

  set requestBody(value: AlgorithmRequest) {
    this._requestBody = value;
  }

  get task(): TaskWorker {
    return this._task;
  }

  get requestBody(): AlgorithmRequest {
    return this._requestBody;
  }

}
@Component({
  selector: 'app-one-click-workflow',
  templateUrl: './one-click-workflow.component.html',
  styleUrls: ['./one-click-workflow.component.scss']
})


export class OneClickWorkflowComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly AT = AlgorithmTypes;
  readonly AG = AlgorithmGroups;

  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;
  Array = Array;
  tasks: TaskWorker[];
  task: TaskWorker;
  pageSelectionAlgorithm = AlgorithmTypes.Preprocessing;
  requestBody = new AlgorithmRequest();
  public selectedAlgorithmForGroup = new Map<AlgorithmGroups, TaskData>([
    [AlgorithmGroups.Preprocessing, new TaskData(this.task, this.requestBody)],
    [AlgorithmGroups.StaffLines, new TaskData(this.task, this.requestBody)],
    [AlgorithmGroups.Layout, new TaskData(this.task, this.requestBody)],
    [AlgorithmGroups.Symbols, new TaskData(this.task, this.requestBody)],
    [AlgorithmGroups.Text, new TaskData(this.task, this.requestBody)],
    [AlgorithmGroups.Syllables, new TaskData(this.task, this.requestBody)]

  ]);
  @ViewChildren(AlgorithmPredictorSettingsComponent) allSettings: QueryList<AlgorithmPredictorSettingsComponent>;

  algorithmParamsChanged(e: {params: AlgorithmPredictorParams, type: AlgorithmTypes}) {
    const requestBody = this.selectedAlgorithmForGroup.get(algorithmTypesGroupMapping.get(e.type)).requestBody;
    let task = this.selectedAlgorithmForGroup.get(algorithmTypesGroupMapping.get(e.type)).task;
    if (requestBody.params !== e.params) {
      this.selectedAlgorithmForGroup.get(algorithmTypesGroupMapping.get(e.type)).requestBody.params = e.params;
      if (task) { task.stopStatusPoller(); }
      task = new TaskWorker(e.type, this.http, this.book, requestBody);
      task.startStatusPoller(2000);
      // console.log(this.selectedAlgorithmForGroup.get(algorithmTypesGroupMapping.get(e.type)).task);
      this.selectedAlgorithmForGroup.get(algorithmTypesGroupMapping.get(e.type)).task = task;
      // console.log(this.selectedAlgorithmForGroup.get(algorithmTypesGroupMapping.get(e.type)).task);
      this.tasks = Array.from(this.selectedAlgorithmForGroup.values()).map(arr => arr.task);
      // console.log(this.tasks);

      this.changeDetector.detectChanges();

    }

  }

  constructor(
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,

  ) {
  }

  ngOnInit() {


  }


  ngOnDestroy(): void {
    this.tasks.forEach(task => task.stopStatusPoller());
  }

  ngAfterViewInit(): void {

  }

  finishedWorkflow($event: boolean) {
    if ($event === true) {
      const message = 'The automatic pipeline has finished. Do you want to switch the view?';
      const dialogData = new ConfirmDialogModel('Process Finished', message);
      const dialogRef = this.dialog.open(WorkflowFinishDialogComponent, {
        maxWidth: '400px',
        data: dialogData
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        let firstPage: string;
        this.http.get<{ pages: PageResponse[], totalPages: number }>(this.book.listPages(), {}).toPromise().then(
          r => {
            firstPage = r.pages[0].label;
            if (confirmed === 'edit') {

              this.router.navigate(['book', this.book.book, 'page', firstPage, 'edit']);

            }
            if ((confirmed === 'view')) {
              this.router.navigate(['book', this.book.book, 'page', firstPage, 'view']);

            }
          },
          err => {
            if (err.error) {
              const error = err.error as ApiError;
              // this.errorMessage = error.userMessage;
            } else {
              // this.errorMessage = err.message;
            }
          }
        );

      });

    }
  }
}
