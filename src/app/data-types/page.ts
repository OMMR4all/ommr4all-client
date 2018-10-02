import { ServerUrls } from '../server-urls';

export class Book {
  constructor(
    public book: string,
  ) {}

  downloadUrl(type: string) {
    return ServerUrls.download(this.book, type);
  }
}

export class Page {
  constructor(
    public book: Book,
    public page: string,
  ) {}

  preview_url(color = 'color', preprocessing = 'original') {
    return ServerUrls.page_content(this.book.book, this.page, color + '_' + preprocessing + '_preview');
  }

  image_url(color = 'color', preprocessing = 'original') {
    return ServerUrls.page_content(this.book.book, this.page, color + '_' + preprocessing);
  }

  content_url(content) {
    return ServerUrls.page_content(this.book.book, this.page, content);
  }

  operation_url(operation) {
    return ServerUrls.page_operation(this.book.book, this.page, operation);
  }
}

export class PageMeta {
  width: number;
  height: number;
}

export class PageResponse {
  constructor(
    public label: string
  ) {}


  toPage(book: Book): Page {
    return new Page(book, this.label);
  }
}


