import {Component, Input, OnInit} from '@angular/core';
import {TaskWorker} from '../../../editor/task';

@Component({
  selector: 'app-book-step-task-progress',
  templateUrl: './book-step-task-progress.component.html',
  styleUrls: ['./book-step-task-progress.component.scss']
})
export class BookStepTaskProgressComponent implements OnInit {
  @Input() task: TaskWorker;
  constructor() { }

  ngOnInit() {
  }

}
