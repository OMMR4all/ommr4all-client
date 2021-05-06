export class ServerUrls {
  private static host = '/api';

  public static bookStyles() { return ServerUrls.host + '/book-styles'; }

  public static ping() { return ServerUrls.host + '/ping'; }

  public static auth(t: string) { return ServerUrls.host + '/auth/' + t; }

  public static administrative(sub: string) { return ServerUrls.host + '/administrative/' + sub; }

  public static page(book: string, page: string, sub: string) {
    return ServerUrls.host + '/book/' + book + '/page/' + page + '/' + sub;
  }

  public static page_content(book: string, page: string, content: string) {
    return ServerUrls.host + '/book/' + book + '/page/' + page + '/content/' + content;
  }
  public static page_svg(book: string, page: string, width: string) {
    return ServerUrls.host + '/book/' + book + '/page/' + page + '/svg/' + width;
  }
  public static page_midi(book: string, page: string) {
    return ServerUrls.host + '/book/' + book + '/page/' + page + '/midi';
  }
  public static page_operation(book: string, page: string, operation: string) {
    return ServerUrls.host + '/book/' + book + '/page/' + page + '/operation/' + operation;
  }
  public static page_operation_status(book: string, page: string, operation: string) {
    return ServerUrls.host + '/book/' + book + '/page/' + page + '/operation_status/' + operation;
  }

  public static book(book: string, path: string) { return ServerUrls.host + '/book/' + book + '/' + path; }
  public static addBook() { return ServerUrls.host + '/books'; }
  public static listBooks(): string { return ServerUrls.host + '/books'; }
  public static deleteBook(book: string): string { return ServerUrls.host + '/book/' + book; }
  public static bookOperation(book: string, operation: string) { return ServerUrls.host + '/book/' + book + /operation/ + operation; }
  public static bookOperationStatus(book: string, operation: string) { return ServerUrls.bookOperation(book, operation) + '/status'; }
  public static bookOperationTask(book: string, operation: string, taskId: string) { return ServerUrls.bookOperation(book, operation + '/task/' + taskId); }
  public static tasks() { return ServerUrls.host + '/tasks'; }
  public static task(taskId: string) { return ServerUrls.host + '/tasks/' + taskId; }

  public static listPages(book: string): string {
    return ServerUrls.host + '/book/' + book;
  }

  public static download(book: string, type: string) {
    return ServerUrls.host + '/book/' + book + '/download/' + type;
  }

  public static virtualKeyboard(book: string) {
    return ServerUrls.host + '/book/' + book + '/virtual_keyboard/';
  }

  public static bookMeta(book: string) { return ServerUrls.host + '/book/' + book + '/meta'; }

  public static document_svg(book: string, document: string, width: string) {
    return ServerUrls.host + '/book/' + book + '/document/' + document + '/svg/' + width;
  }
  public static document_midi(book: string, document: string) {
    return ServerUrls.host + '/book/' + book + '/document/' + document + '/midi';
  }
  public static document_content(book: string, document: string) {
    return ServerUrls.host + '/book/' + book + '/document/' + document + '/content';
  }


}
