import { ServerUrls } from '../server-urls';
import {OperationUrlProvider} from '../editor/task';
import {HttpClient} from '@angular/common/http';
import {BookMeta} from '../book-list.service';
import {AlgorithmTypes} from '../book-view/book-step/algorithm-predictor-params';
import {BookPermissionFlag, BookPermissionFlags} from './permissions';
import {Observable} from 'rxjs';

export class BookCommunication implements OperationUrlProvider {
  constructor(
    public book: string,
  ) {}

  equals(o: BookCommunication) { return o && this.book === o.book; }
  listPages() { return ServerUrls.listPages(this.book); }
  downloadUrl(type: string) { return ServerUrls.download(this.book, type); }
  virtualKeyboardUrl() { return ServerUrls.virtualKeyboard(this.book); }
  meta() { return ServerUrls.bookMeta(this.book); }
  saveMeta(http: HttpClient, meta: BookMeta): Observable<object> { if (new BookPermissionFlags(meta.permissions).has(BookPermissionFlag.EditBookMeta)) { return http.put(this.meta(), meta.toJson()); } return new Observable(); }
  url(s: string) { return ServerUrls.book(this.book, s); }
  commentsUrl() { return ServerUrls.book(this.book, 'comments'); }
  commentsCountUrl() { return ServerUrls.book(this.book, 'comments/count'); }
  permissionsUrl() { return ServerUrls.book(this.book, 'permissions'); }
  renamePagesUrl() { return ServerUrls.book(this.book, 'rename_pages/'); }
  permissionsDefaultUrl() { return ServerUrls.book(this.book, 'permissions/default'); }
  permissionsUserUrl(username) { return ServerUrls.book(this.book, 'permissions/user/' + username); }
  permissionsGroupUrl(name) { return ServerUrls.book(this.book, 'permissions/group/' + name); }
  operationTaskUrl(operation: AlgorithmTypes, taskId: string) { return ServerUrls.bookOperationTask(this.book, operation, taskId); }
  operationUrl(operation: AlgorithmTypes, sub = '', statusOnly = false) {
    if (statusOnly) {
      return ServerUrls.bookOperationStatus(this.book, operation + '/' + sub);
    } else {
      return ServerUrls.bookOperation(this.book, operation + '/' + sub);
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
  svg_url(width) {
    return ServerUrls.page_svg(this.book.book, this.page, width);
  }
  lock_url() { return ServerUrls.page(this.book.book, this.page, 'lock'); }


  rename_url() { return ServerUrls.page(this.book.book, this.page, 'rename'); }

  operationTaskUrl(operation: AlgorithmTypes|string, taskId: string) {
    return ServerUrls.page_operation(this.book.book, this.page, operation) + '/task/' + taskId;
  }

  operationUrl(operation: AlgorithmTypes|string, sub = '', statusOnly = false) {
    if (statusOnly) {
      return ServerUrls.page_operation_status(this.book.book, this.page, operation + '/' + sub);
    } else {
      return ServerUrls.page_operation(this.book.book, this.page, operation + '/' + sub);
    }
  }
}

export class PageResponse {
  constructor(
    public label: string
  ) {}
}


