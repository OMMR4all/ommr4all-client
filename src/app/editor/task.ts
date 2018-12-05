export enum TaskStatusCodes {
  Queued = 0,
  Running = 1,
  Finished = 2,
  Error = 3,
}

export enum TaskProgressCodes {
  INITIALIZING = 0,
  WORKING = 1,
  FINALIZING = 2,
}

export class TaskStatus {
  constructor(
    public code: TaskStatusCodes,
    public progress_code: TaskProgressCodes,
    public progress: number,
    public accuracy: number,
  ) {}
}

