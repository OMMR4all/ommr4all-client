import { Component, OnInit, inject } from '@angular/core';
import { EditorService } from '../editor/editor.service';

@Component({
    selector: 'app-preprocessing',
    templateUrl: './preprocessing.component.html',
    styleUrls: ['./preprocessing.component.css'],
    standalone: false
})
export class PreprocessingComponent implements OnInit {
  editorService = inject(EditorService);


  ngOnInit() {
  }

}
