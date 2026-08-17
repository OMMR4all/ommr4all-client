import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {ServerUrls} from '../../server-urls';
import {TaskStatus, taskStatusCodeLabels} from '../../editor/task';
import {RestAPIUser} from '../../authentication/user';
import {AlgorithmTypes, metaForAlgorithmType} from '../../book-view/book-step/algorithm-predictor-params';
import {BookMeta} from '../../book-list.service';
import {GlobalSettingsService} from '../../global-settings.service';
import {formatDuration} from '../../utils/duration';

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
    styleUrls: ['./administrative-view-tasks.component.scss'],
    standalone: false
})
export class AdministrativeViewTasksComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  globalSettings = inject(GlobalSettingsService);

  tasks = new Array<Task>();
  private refreshTimer;
  readonly taskStatusCodeLabels = taskStatusCodeLabels;

  // Not every algorithm type has a meta entry (e.g. document_alignment,
  // documents_export) — an unguarded .label here breaks the whole table row
  algorithmLabel(type: AlgorithmTypes): string {
    const meta = metaForAlgorithmType.get(type);
    return meta ? meta.label : type;
  }

  notationStyleName(id: string): string {
    const style = this.globalSettings.bookStyleById(id);
    return style ? style.name : id;
  }

  displayedColumns = ['book', 'notationStyle', 'algorithmType', 'creator', 'status', 'progress', 'duration', 'cancel'];

  // A task that has not started yet shows how long it has been waiting instead.
  durationLabel(status: TaskStatus): string {
    if (status.run_time >= 0) { return formatDuration(status.run_time); }
    const queued = formatDuration(status.queued_time);
    return queued ? 'queued ' + queued : '';
  }

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
