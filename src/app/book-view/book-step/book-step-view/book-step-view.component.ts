import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BookCommunication} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {TaskWorker} from '../../../editor/task';
import {
  AlgorithmGroups,
  algorithmGroupTypesMapping,
  AlgorithmPredictorParams,
  AlgorithmRequest,
  AlgorithmTypes
} from '../algorithm-predictor-params';
import {HttpClient} from '@angular/common/http';
import {ModelMeta} from '../../../data-types/models';
import {AlgorithmPredictorSettingsComponent} from '../../../common/algorithm-steps/algorithm-predictor-settings/algorithm-predictor-settings.component';

@Component({
  selector: 'app-book-step-view',
  templateUrl: './book-step-view.component.html',
  styleUrls: ['./book-step-view.component.scss']
})
export class BookStepViewComponent implements OnInit, OnDestroy {
  @Input() algorithmGroup: AlgorithmGroups;
  @Input() book: BookCommunication;
  @Input() bookMeta: BookMeta;
  task: TaskWorker;

  requestBody = new AlgorithmRequest();
  @ViewChild(AlgorithmPredictorSettingsComponent, {static: true}) settings: AlgorithmPredictorSettingsComponent;
  get algorithmType() { return this.settings.algorithmType; }
  algorithmParamsChanged(e: {params: AlgorithmPredictorParams, type: AlgorithmTypes}) {
    if (this.requestBody.params !== e.params) {
      this.requestBody.params = e.params;
      if (this.task) { this.task.stopStatusPoller(); }
      this.task = new TaskWorker(e.type, this.http, this.book, this.requestBody);
      this.task.startStatusPoller(2000);
      this.changeDetector.detectChanges();
    }
  }

  constructor(
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
  }


  ngOnDestroy(): void {
    this.task.stopStatusPoller();
  }

}
