import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServerUrls } from '../../../server-urls';
import { WorkerResourcesResponse } from '../../../book-view/book-step/algorithm-predictor-params';

type WorkerResource = 'cpu' | 'gpu';

@Component({
    selector: 'app-worker-resource-selector',
    templateUrl: './worker-resource-selector.component.html',
    styleUrls: ['./worker-resource-selector.component.scss'],
    standalone: false
})
export class WorkerResourceSelectorComponent implements OnInit, OnChanges {
  private http = inject(HttpClient);

  // an AlgorithmTypes value (e.g. 'text_llm') or a training operation (e.g. 'train_symbols')
  @Input() operation: string;
  // 'cpu'/'gpu'; null = let the server pick the algorithm's default (e.g. old server)
  @Output() selectedChange = new EventEmitter<string>();

  readonly resourceKeys: WorkerResource[] = ['cpu', 'gpu'];
  resources: WorkerResourcesResponse['resources'] = null;

  private _selected: string = null;
  get selected() { return this._selected; }
  set selected(v: string) {
    this._selected = v;
    this.selectedChange.emit(v);
  }

  ngOnInit() { this.refresh(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.operation && !changes.operation.firstChange) { this.refresh(); }
  }

  label(resource: WorkerResource) { return resource === 'gpu' ? 'GPU' : 'CPU'; }

  selectable(resource: WorkerResource): boolean {
    const info = this.resources ? this.resources[resource] : null;
    return !!info && info.allowed && info.n_workers > 0;
  }

  hint(resource: WorkerResource): string {
    const info = this.resources ? this.resources[resource] : null;
    if (!info) { return ''; }
    if (!info.allowed) { return 'not supported by this algorithm'; }
    if (info.n_workers === 0) { return 'not available on this server'; }
    if (info.n_free > 0 && info.n_tasks_queued === 0) { return 'free'; }
    return info.n_tasks_queued + ' task(s) ahead';
  }

  private refresh() {
    if (!this.operation) {
      this.resources = null;
      this.selected = null;
      return;
    }
    this.http.get<WorkerResourcesResponse>(ServerUrls.workerResources(this.operation)).subscribe(
      r => {
        this.resources = r.resources;
        // preselect the server default; if it has no workers fall back to a
        // selectable alternative (the server rejects unavailable explicit choices)
        const def = this.resourceKeys.find(k => r.resources[k].default);
        if (def && this.selectable(def)) {
          this.selected = def;
        } else {
          this.selected = this.resourceKeys.find(k => this.selectable(k)) || def || null;
        }
      },
      () => {
        // endpoint missing (old server): hide the selector and send no preference
        this.resources = null;
        this.selected = null;
      },
    );
  }
}
