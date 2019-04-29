import { ServerUrls } from '../server-urls';

export class BookCommunication {
  constructor(
    public book: string,
  ) {}

  equals(o: BookCommunication) { return o && this.book === o.book; }
  downloadUrl(type: string) { return ServerUrls.download(this.book, type); }
  virtualKeyboardUrl() { return ServerUrls.virtualKeyboard(this.book); }
  meta() { return ServerUrls.bookMeta(this.book); }
  commentsUrl() { return ServerUrls.book(this.book, 'comments'); }
  commentsCountUrl() { return ServerUrls.book(this.book, 'comments/count'); }
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

  lock_url() { return ServerUrls.page(this.book.book, this.page, 'lock'); }

  operation_url(operation, status_only = false) {
    if (status_only) {
      return ServerUrls.page_operation_status(this.book.book, this.page, operation);
    } else {
      return ServerUrls.page_operation(this.book.book, this.page, operation);
    }
  }
}

export class PageResponse {
  constructor(
    public label: string
  ) {}
}


