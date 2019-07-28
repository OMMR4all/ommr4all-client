import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiError} from '../../utils/api-error';

@Component({
  selector: 'app-api-error-card',
  templateUrl: './api-error-card.component.html',
  styleUrls: ['./api-error-card.component.scss']
})
export class ApiErrorCardComponent implements OnInit {
  @Input() apiError: ApiError;
  @Output() dismiss = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }
}
