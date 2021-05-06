import {Component, Input, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Document} from '../../../book-documents';
import {BookCommunication, DocumentCommunication} from '../../../data-types/communication';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-document-monody-selection',
  templateUrl: './document-monody-selection.component.html',
  styleUrls: ['./document-monody-selection.component.scss']
})
export class DocumentMonodySelectionComponent implements OnInit {
  myControl = new FormControl();
  // Todo just for showscase purposes
  options: string[] = ['efe3d558-35a2-4f03-9d44-2eff3202481c', 'd98ace96-6878-41ac-9251-08fc49fcd1bb ', 'd98ace96-6878-41ac-9251-08fc49fcd1bb',
    'efe3d558-35a2-4f03-9d44-2eff3202481c', 'd98ace96-6878-41ac-9251-08fc49fcd1bb ', 'd98ace96-6878-41ac-9251-08fc49fcd1bb',
    'efe3d558-35a2-4f03-9d44-2eff3202481c', 'd98ace96-6878-41ac-9251-08fc49fcd1bb ', 'd98ace96-6878-41ac-9251-08fc49fcd1bb',
    'efe3d558-35a2-4f03-9d44-2eff3202481c', 'd98ace96-6878-41ac-9251-08fc49fcd1bb ', 'd98ace96-6878-41ac-9251-08fc49fcd1bb',
    'efe3d558-35a2-4f03-9d44-2eff3202481c', 'd98ace96-6878-41ac-9251-08fc49fcd1bb ', 'd98ace96-6878-41ac-9251-08fc49fcd1bb',
    'efe3d558-35a2-4f03-9d44-2eff3202481c', 'd98ace96-6878-41ac-9251-08fc49fcd1bb ', 'd98ace96-6878-41ac-9251-08fc49fcd1bb',
    'efe3d558-35a2-4f03-9d44-2eff3202481c', 'd98ace96-6878-41ac-9251-08fc49fcd1bb ', 'd98ace96-6878-41ac-9251-08fc49fcd1bb'];
  @Input()
  document: Document;
  @Input()
  bookCom: BookCommunication;
  public documentCom: DocumentCommunication;
  constructor(private http: HttpClient,
  ) {

  }

  ngOnInit() {
    this.myControl = new FormControl(this.document.monody_id);
    this.documentCom = new DocumentCommunication(this.bookCom, this.document.doc_id);
  }
  onChange($event) {
    this.document.monody_id = $event;
    this.http.put(this.documentCom.content_url(), this.document.toJson(), undefined).subscribe(
      data => {
            console.log('Updated document successfully'); },
      error => {
        console.log('Failed on updating document ');
      }
    );
    this.documentCom.content_url();
  }
}
