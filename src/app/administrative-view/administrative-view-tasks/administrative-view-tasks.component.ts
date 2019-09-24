import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerUrls} from '../../server-urls';
import {TaskStatus, taskStatusCodeLabels} from '../../editor/task';
import {RestAPIUser} from '../../authentication/user';
import {AlgorithmTypes, metaForAlgorithmType} from '../../book-view/book-step/algorithm-predictor-params';
import {BookMeta} from '../../book-list.service';
import {GlobalSettingsService} from '../../global-settings.service';

interface Task {
  id: string;
  creator: RestAPIUser;
  status: TaskStatus;
  algorithmType: AlgorithmTypes;
  book: BookMeta;
}

@Component({
  selector: 'app-administrative-view-tasks',
  templateUrl: './administrative-view-tasks.component.html',
  styleUrls: ['./administrative-view-tasks.component.scss']
})
export class AdministrativeViewTasksComponent implements OnInit, OnDestroy {
  tasks = new Array<Task>();
  private refreshTimer;
  readonly taskStatusCodeLabels = taskStatusCodeLabels;
  readonly metaForAlgorithmType = metaForAlgorithmType;

  displayedColumns = ['book', 'notationStyle', 'algorithmType', 'creator', 'status', 'progress', 'cancel'];

  constructor(
    private http: HttpClient,
    public globalSettings: GlobalSettingsService,
    ) { }

  ngOnInit() {
    this.refresh();
    this.refreshTimer = setInterval(() => this.refresh(), 5000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  refresh() {
    this.http.get<Task[]>(ServerUrls.tasks()).subscribe(r => {
        this.tasks.length = 0;
        this.tasks = r;
      },
      error => {

      });
  }

  cancel(id: string) {
    this.http.delete(ServerUrls.task(id)).subscribe(r => {
        this.tasks = this.tasks.filter(t => t.id !== id);
      },
      error => {

      });
  }

}
