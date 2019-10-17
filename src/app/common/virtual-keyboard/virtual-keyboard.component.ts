import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {HttpClient} from '@angular/common/http';

export interface VirtualKeyboard {
  rows: Array<Array<string>>;
}

@Component({
  selector: 'app-virtual-keyboard',
  templateUrl: './virtual-keyboard.component.html',
  styleUrls: ['./virtual-keyboard.component.css'],
})
export class VirtualKeyboardComponent implements OnInit {
  @Output() buttonClicked = new EventEmitter<string>();
  private _url: string = null;  // url where to request a virtual keyboard
  @Input() get url() { return this._url; }
  set url(url: string) { if (this._url !== url) { this._url = url; this.reloadFromUrl(); } }
  @Input() storePermitted = false;

  @Input() virtualKeyboard = {
    rows: [
    ]
  };

  isDragging = false;

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
  }

  private reloadFromUrl() {
    if (!this.url) { return; }
    this.http.get<VirtualKeyboard>(this._url).subscribe(
      kb => {
        this.virtualKeyboard = kb;
        console.log(this.virtualKeyboard);
      }
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
    this.keyboardLayoutChanged();
  }

  addRow(event: CdkDragDrop<string[]>) {
    this.virtualKeyboard.rows.push([event.previousContainer.data[event.previousIndex]]);
    event.previousContainer.data.splice(event.previousIndex, 1);
    this.keyboardLayoutChanged();
  }

  dragStarted() {
    this.isDragging = true;
  }

  dragEnded() {
    this.isDragging = false;
  }

  remove(event: CdkDragDrop<string[]>) {
    event.previousContainer.data.splice(event.previousIndex, 1);
    this.keyboardLayoutChanged();
  }

  add(v: string) {
    if (this.virtualKeyboard.rows.length === 0) {
      this.virtualKeyboard.rows.push([v]);
    } else {
      this.virtualKeyboard.rows[0].push(v);
    }
    this.keyboardLayoutChanged();
  }

  private keyboardLayoutChanged() {
    this.cleanEmptyRows();
    this.storeToUrl();
  }

  private cleanEmptyRows() {
    this.virtualKeyboard.rows = this.virtualKeyboard.rows.filter(r => r.length > 0);
  }

  private storeToUrl() {
    if (!this.storePermitted) { return; }
    if (this.url) {
      this.http.put(this.url, this.virtualKeyboard).subscribe(
      );
    }
  }

  buttonClick(e: MouseEvent, s: string) {
    this.buttonClicked.emit(s);
  }

  mouseDown(e: MouseEvent) {
    e.preventDefault();
  }
  mouseUp(e: MouseEvent) { }
}
