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
  // tslint:disable-next-line:max-line-length
  saveMeta(http: HttpClient, meta: BookMeta): Observable<object> { if (new BookPermissionFlags(meta.permissions).has(BookPermissionFlag.EditBookMeta)) { return http.put(this.meta(), meta.toJson()); } return new Observable(); }
  url(s: string) { return ServerUrls.book(this.book, s); }
  commentsUrl() { return ServerUrls.book(this.book, 'comments'); }
  documentsUrl() { return ServerUrls.book(this.book, 'documents'); }
  dictionaryUrl() { return ServerUrls.book(this.book, 'dictionary'); }
  documentsOdsUrl() { return ServerUrls.book(this.book, 'documents/meta/ods'); }
  monodiUrl() { return ServerUrls.book(this.book, 'documents/monodi/'); }
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

export class DocumentCommunication {
  constructor(
    public book: BookCommunication,
    public document: string,
  ) {
  }
  svg_url(width) {
    return ServerUrls.document_svg(this.book.book, this.document, width);
  }
  midi_url() {
    return ServerUrls.document_midi(this.book.book, this.document);
  }
  content_url() {
    return ServerUrls.document_content(this.book.book, this.document);
  }
  document_config_ods_url() {
    return ServerUrls.document_config_ods(this.book.book, this.document);

  }
  document_line_image(index) {
    return ServerUrls.document_line_image(this.book.book, this.document, index);

  }
  document_line_text(index) {
    return ServerUrls.document_line_text(this.book.book, this.document, index);

  }
  document_update_pcgts() {
    return ServerUrls.document_update_pcgts(this.book.book, this.document);
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
  midi_url() {
    return ServerUrls.page_midi(this.book.book, this.page);
  }
  lock_url() { return ServerUrls.page(this.book.book, this.page, 'lock'); }

  document_page_update_url() {
    return ServerUrls.page(this.book.book, this.page, 'documents');
  }
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


