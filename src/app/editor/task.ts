export enum TaskStatusCodes {
  Queued = 0,
  Running = 1,
  Finished = 2,
  Error = 3,
}

export class TaskStatus {
  constructor(
    public code: TaskStatusCodes,
    public progress: number,
    public accuracy: number,
  ) {}
}

