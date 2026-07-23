import {Injectable, inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BookCommunication} from '../../../data-types/communication';
import {WorkflowRunner} from './workflow-runner';

/**
 * Root-scoped owner of the workflow runners, one per book. Because the service
 * lives for the lifetime of the app, a running workflow (and the polling loop of
 * its active TaskWorker) survives destruction of the workflow tab component, so
 * the user can navigate away and return without losing the progress state.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowRunnerService {
  private http = inject(HttpClient);
  private readonly runners = new Map<string, WorkflowRunner>();

  /** Get the existing runner for this book, or create one. */
  runnerFor(book: BookCommunication): WorkflowRunner {
    let runner = this.runners.get(book.book);
    if (!runner) {
      runner = new WorkflowRunner(this.http, book);
      this.runners.set(book.book, runner);
    }
    return runner;
  }
}
