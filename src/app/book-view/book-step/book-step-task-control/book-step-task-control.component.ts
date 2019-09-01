import {Component, Input, OnInit} from '@angular/core';
import {TaskWorker} from '../../../editor/task';
import {BookPermissionFlag, BookPermissionFlags} from '../../../data-types/permissions';

@Component({
  selector: 'app-book-step-task-control',
  templateUrl: './book-step-task-control.component.html',
  styleUrls: ['./book-step-task-control.component.scss']
})
export class BookStepTaskControlComponent implements OnInit {
  @Input() task: TaskWorker;
  @Input() permissions: number;
  get algorithmRunAllowed() { return new BookPermissionFlags(this.permissions).has(BookPermissionFlag.Write); }

  constructor() { }

  ngOnInit() {
  }

  run() {
    this.task.putTask();
  }

  cancel() {
    this.task.cancelTask().then(
      () => {},
      () => {},
    );
  }
}
