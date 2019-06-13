import {Component, Input, OnInit} from '@angular/core';
import {TaskWorker} from '../../../editor/task';

@Component({
  selector: 'app-book-step-task-control',
  templateUrl: './book-step-task-control.component.html',
  styleUrls: ['./book-step-task-control.component.scss']
})
export class BookStepTaskControlComponent implements OnInit {
  @Input() task: TaskWorker;

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
