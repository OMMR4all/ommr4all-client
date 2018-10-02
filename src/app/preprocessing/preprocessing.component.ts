import { Component, OnInit } from '@angular/core';
import { EditorService } from '../editor/editor.service';

@Component({
  selector: 'app-preprocessing',
  templateUrl: './preprocessing.component.html',
  styleUrls: ['./preprocessing.component.css']
})
export class PreprocessingComponent implements OnInit {

  constructor(public editorService: EditorService) { }

  ngOnInit() {
  }

}
