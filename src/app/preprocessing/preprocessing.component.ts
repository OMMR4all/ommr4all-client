import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { EditorService } from '../editor/editor.service';

@Component({
    selector: 'app-preprocessing',
    templateUrl: './preprocessing.component.html',
    styleUrls: ['./preprocessing.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PreprocessingComponent implements OnInit {
  editorService = inject(EditorService);


  ngOnInit() {
  }

}
