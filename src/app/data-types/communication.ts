import { ServerUrls } from '../server-urls';
import {Page} from './page/page';

export class BookCommunication {
  constructor(
    public book: string,
  ) {}

  equals(o: BookCommunication) { return o && this.book === o.book; }

  downloadUrl(type: string) {
    return ServerUrls.download(this.book, type);
  }
}

export class PageCommunication {
  constructor(
    public book: BookCommunication,
    public page: string,
  ) {}

  equals(o: PageCommunication) { return o && this.page === o.page && this.book.equals(o.book); }

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

export class PageResponse {
  constructor(
    public label: string
  ) {}
}


