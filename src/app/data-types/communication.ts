import { ServerUrls } from '../server-urls';
import {OperationUrlProvider} from '../editor/task';

export class BookCommunication implements OperationUrlProvider {
  constructor(
    public book: string,
  ) {}

  equals(o: BookCommunication) { return o && this.book === o.book; }
  listPages() { return ServerUrls.listPages(this.book); }
  downloadUrl(type: string) { return ServerUrls.download(this.book, type); }
  virtualKeyboardUrl() { return ServerUrls.virtualKeyboard(this.book); }
  meta() { return ServerUrls.bookMeta(this.book); }
  commentsUrl() { return ServerUrls.book(this.book, 'comments'); }
  commentsCountUrl() { return ServerUrls.book(this.book, 'comments/count'); }
  permissionsUrl() { return ServerUrls.book(this.book, 'permissions'); }
  renamePagesUrl() { return ServerUrls.book(this.book, 'rename_pages/'); }
  permissionsDefaultUrl() { return ServerUrls.book(this.book, 'permissions/default'); }
  permissionsUserUrl(username) { return ServerUrls.book(this.book, 'permissions/user/' + username); }
  permissionsGroupUrl(name) { return ServerUrls.book(this.book, 'permissions/group/' + name); }
  operationTaskUrl(operation, taskId: string) { return ServerUrls.bookOperationTask(this.book, operation, taskId); }
  operationUrl(operation, statusOnly = false) {
    if (statusOnly) {
      return ServerUrls.bookOperationStatus(this.book, operation);
    } else {
      return ServerUrls.bookOperation(this.book, operation);
    }
  }
}

export class PageCommunication implements OperationUrlProvider {
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

  rename_url() { return ServerUrls.page(this.book.book, this.page, 'rename'); }

  operationTaskUrl(operation, taskId: string) {
    return ServerUrls.page_operation(this.book.book, this.page, operation) + '/task/' + taskId;
  }

  operationUrl(operation, statusOnly = false) {
    if (statusOnly) {
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


