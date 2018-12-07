export class PageAnnotation {
  constructor(
    public files: any,
    public width: number,
    public height: number,
    public annotation_data: any) {
  }
}

export class ServerUrls {
  private static host = '/api';

  public static ping() { return ServerUrls.host + '/ping'; }

  public static page_content(book: string, page: string, content: string) {
    return ServerUrls.host + '/book/' + book + '/' + page + '/content/' + content;
  }

  public static page_operation(book: string, page: string, operation: string) {
    return ServerUrls.host + '/book/' + book + '/' + page + '/operation/' + operation;
  }
  public static page_operation_status(book: string, page: string, operation: string) {
    return ServerUrls.host + '/book/' + book + '/' + page + '/operation_status/' + operation;
  }

  public static addBook() { return ServerUrls.host + '/books/new'; }
  public static listBooks(): string { return ServerUrls.host + '/books/list'; }
  public static deleteBook(): string { return ServerUrls.host + '/books/delete'; }

  public static listPages(book: string): string {
    return ServerUrls.host + '/book/' + book + '/list/';
  }

  public static save_page_staffs(book: string, page: string) {
    return ServerUrls.host + '/book/' + book + '/' + page + '/save';
  }

  public static download(book: string, type: string) {
    return ServerUrls.host + '/book/' + book + '/download/' + type;
  }
}
