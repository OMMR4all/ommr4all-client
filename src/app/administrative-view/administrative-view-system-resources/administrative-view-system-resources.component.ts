import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {ServerUrls} from '../../server-urls';
import {AlgorithmTypes, metaForAlgorithmType} from '../../book-view/book-step/algorithm-predictor-params';
import {RestAPIUser} from '../../authentication/user';

// The server reports how busy the machine is, never what machine it is: no hardware models, no
// library or driver versions, no absolute sizes and no error text. See restapi/systeminfo.py.

export interface CudaDevice {
  index: number;
  compute_ok: boolean;
}

export interface CudaStatus {
  state: 'checking' | 'ready';
  available?: boolean;
  devices?: CudaDevice[];
}

export interface GpuInfo {
  index: number;
  utilization: number | null;
  memory_percent: number | null;
}

export interface WorkerTaskInfo {
  id: string;
  algorithmType: AlgorithmTypes;
  book: string;
  creator: RestAPIUser;
}

export interface WorkerInfo {
  group: string;
  gpu_id: number;
  used: boolean;
  // the slot's last worker process could not be killed and may still hold its hardware,
  // so nothing new is scheduled onto it
  quarantined: boolean;
  quarantine_reason: string | null;
  quarantined_since: number | null;
  // 'disk-sleep' is uninterruptible sleep: the process ignores every signal
  process_state: string | null;
  task: WorkerTaskInfo | null;
}

export interface SchedulerHealth {
  scheduler: {alive: boolean, heartbeatAge: number, iterations: number, restarts: number, nRunning: number};
  communicator: {alive: boolean, heartbeatAge: number, restarts: number};
  started: boolean;
  healthy: boolean;
  nQuarantined: number;
  unreapedWorkers: {worker: string, pid: number, alive: boolean, reason: string, retiredAt: number}[];
}

export interface DiskInfo {
  label: string;
  percent: number;
}

export interface SystemResources {
  cpu: {percent: number};
  memory: {percent: number};
  swap: {percent: number} | null;
  disks: DiskInfo[];
  gpus: GpuInfo[];
  gpu_available: boolean;
  cuda: CudaStatus;
  workers: WorkerInfo[];
  scheduler: SchedulerHealth;
  queue: {n_total: number, n_running: number, n_queued: number};
}

@Component({
    selector: 'app-administrative-view-system-resources',
    templateUrl: './administrative-view-system-resources.component.html',
    styleUrls: ['./administrative-view-system-resources.component.scss'],
    standalone: false
})
export class AdministrativeViewSystemResourcesComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  resources: SystemResources = null;
  error = false;
  repairing = false;
  private refreshTimer;

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

  refresh(refreshCuda = false) {
    const url = ServerUrls.systemResources() + (refreshCuda ? '?refresh_cuda=1' : '');
    this.http.get<SystemResources>(url).subscribe(
      r => { this.resources = r; this.error = false; },
      () => { this.error = true; },
    );
  }

  /** Re-runs the torch probe, e.g. after a driver or torch update. */
  recheckCuda() {
    this.refresh(true);
  }

  get cuda(): CudaStatus {
    return this.resources ? this.resources.cuda : null;
  }

  cudaDevice(gpu: GpuInfo): CudaDevice {
    const cuda = this.cuda;
    if (!cuda || !cuda.devices) { return null; }
    return cuda.devices.find(d => d.index === gpu.index);
  }

  /** 'ok' | 'broken' | 'unavailable' | 'checking' — drives the summary badge. */
  get cudaState(): string {
    const cuda = this.cuda;
    if (!cuda || cuda.state === 'checking') { return 'checking'; }
    if (!cuda.available) { return 'unavailable'; }
    const devices = cuda.devices || [];
    if (devices.length === 0) { return 'unavailable'; }
    return devices.every(d => d.compute_ok) ? 'ok' : 'broken';
  }

  /** The worker slot bound to a GPU, if the task scheduler knows about it. */
  // shown on a card that nvidia-smi reports but that has no worker slot: it is
  // installed and idle-looking, yet nothing will ever be scheduled onto it
  readonly noWorkerTooltip = $localize`:@@gpuNoWorkerTooltip:This GPU has no task worker, so no task is ever run on it. Set OMMR4ALL_GPUS on the server to change which GPUs are used.`;

  workerOfGpu(gpu: GpuInfo): WorkerInfo {
    if (!this.resources) { return null; }
    return this.resources.workers.find(w => w.gpu_id === gpu.index);
  }

  get gpuWorkers(): WorkerInfo[] {
    return this.resources ? this.resources.workers.filter(w => w.gpu_id >= 0) : [];
  }

  get cpuWorkers(): WorkerInfo[] {
    return this.resources ? this.resources.workers.filter(w => w.gpu_id < 0) : [];
  }

  get busyCpuWorkers(): number {
    return this.cpuWorkers.filter(w => w.used).length;
  }

  get scheduler(): SchedulerHealth {
    return this.resources ? this.resources.scheduler : null;
  }

  /** True while the server cannot start tasks at all, however free the slots look. */
  get schedulerBroken(): boolean {
    return !!this.scheduler && !this.scheduler.healthy;
  }

  get quarantinedWorkers(): WorkerInfo[] {
    return this.resources ? this.resources.workers.filter(w => w.quarantined) : [];
  }

  workerLabel(worker: WorkerInfo): string {
    return worker.gpu_id >= 0 ? 'GPU ' + worker.gpu_id : worker.group.replace(/_/g, ' ');
  }

  /** Restarts dead or stalled scheduler threads and reclaims slots left marked busy. */
  repairScheduler() {
    this.postRepair({action: 'repair'});
  }

  /** Hands a slot back to the scheduler even though its worker process refuses to die. */
  releaseWorker(worker: WorkerInfo) {
    const index = this.resources.workers.indexOf(worker);
    if (index < 0) { return; }
    this.postRepair({action: 'release', worker: index});
  }

  private postRepair(body: object) {
    this.repairing = true;
    this.http.post(ServerUrls.systemResourcesRepair(), body).subscribe(
      () => { this.repairing = false; this.refresh(); },
      () => { this.repairing = false; this.error = true; },
    );
  }

  algorithmLabel(type: AlgorithmTypes): string {
    const meta = metaForAlgorithmType.get(type);
    return meta ? meta.label : type;
  }

  creatorName(task: WorkerTaskInfo): string {
    if (!task || !task.creator) { return ''; }
    return (task.creator.firstName + ' ' + task.creator.lastName).trim() || task.creator.username;
  }

  percent(value: number): string {
    return value === null || value === undefined ? '–' : value.toFixed(0) + ' %';
  }
}
