import { Injectable } from '@angular/core';

export class PageAnnotation {
  constructor(
    public originalImageUrl: string,
    public binaryImageUrl: string,
    public grayImageUrl: string,
    public deskewedOriginalImageUrl: string,
    public deskewedGrayImageUrl: string,
    public deskewedBinaryImageUrl: string,
    public width: number,
    public height: number,
    public data) {
  }
}

export enum PageContent {
  ORIGINAL = 'original',
  DETECTED_STAFFS = 'detected_staffs',
}

@Injectable({
  providedIn: 'root'
})
export class ServerUrlsService {
  private host = '/api';

  constructor() { }

  list_pages(book: string): string {
    return this.host + '/listpages/' + book;
  }

  page_annotation(book: string, page: string) {
    return this.host + '/annotation/' + book + '/' + page;
  }

  save_page_staffs(book: string, page: string) {
    return this.host + '/save_page/' + book + '/' + page;
  }

  page_content(book: string, page: string, content: PageContent) {
    return this.host + '/content/' + book + '/' + page + '/' + content;
  }
}
