import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.css']
})
export class ErrorMessageComponent implements OnInit {
  @Input() error: string;
  @Input() closable = true;
  @Output() closed = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  close() {
    this.error = '';
    this.closed.emit();
  }

}
