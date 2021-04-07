import {Component, Input, OnInit} from '@angular/core';
import {TaskWorker} from '../../../editor/task';
import {BookPermissionFlag, BookPermissionFlags} from '../../../data-types/permissions';

@Component({
  selector: 'app-book-step-tasks-control',
  templateUrl: './book-step-tasks-control.component.html',
  styleUrls: ['./book-step-tasks-control.component.scss']
})
export class BookStepTasksControlComponent implements OnInit {

  @Input() tasks: TaskWorker[];
  @Input() permissions: number;
  get algorithmRunAllowed() { return new BookPermissionFlags(this.permissions).has(BookPermissionFlag.Write); }
  task: TaskWorker;
  pointer: number;
  constructor() { }

  ngOnInit() {
    this.task = this.tasks[0];
  }
  get overallProgress() {
    return this.pointer  / this.tasks.length;
  }
  runTask(pointer: number) {
    if (pointer <= this.tasks.length - 1) {
      this.pointer = pointer + 1;
      console.log(this.tasks[pointer]);
      this.task = this.tasks[pointer];
      this.tasks[pointer].putTask();
      this.tasks[pointer].taskFinished.subscribe(res => this.runTask(this.pointer));
    }
  }
  run() {
    this.pointer = 0;
    this.runTask(this.pointer);
  }

  cancel() {
    this.task.cancelTask().then(
      () => {},
      () => {},
    );
  }
}
