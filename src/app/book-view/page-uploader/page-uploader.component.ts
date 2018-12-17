import { Component, OnInit } from '@angular/core';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { BookViewService } from '../book-view.service';

@Component({
  selector: 'app-page-uploader',
  templateUrl: './page-uploader.component.html',
  styleUrls: ['./page-uploader.component.css']
})
export class PageUploaderComponent implements OnInit {
  constructor(private books: BookViewService) {
  }

  get config() {
    return {
      url: '/api/book/' + this.books.currentBook.book + '/upload/',
      maxFilesize: 50,
      acceptedFiles: 'image/*',
      headers: {
        'Authorization': 'JWT ' + localStorage.getItem('id_token'),
      }
    };
  }

  ngOnInit() {
  }

  onUploadError(event) {
    console.log(event);
  }

  onUploadSuccess(event) {
    console.log(event);
  }

}
