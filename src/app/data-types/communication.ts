import { ServerUrls } from '../server-urls';

export class BookCommunication {
  constructor(
    public book: string,
  ) {}

  downloadUrl(type: string) {
    return ServerUrls.download(this.book, type);
  }
}

export class PageCommunication {
  constructor(
    public book: BookCommunication,
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

export class PageResponse {
  constructor(
    public label: string
  ) {}
}


