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

  public static page_content(book: string, page: string, content: string) {
    return ServerUrls.host + '/book/' + book + '/' + page + '/content/' + content;
  }

  public static add_book(book: string) {
    return ServerUrls.host + '/books/new/' + book;
  }

  public static list_books(): string {
    return ServerUrls.host + '/books/list';
  }

  public static list_pages(book: string): string {
    return ServerUrls.host + '/book/' + book + '/list/';
  }

  public static save_page_staffs(book: string, page: string) {
    return ServerUrls.host + '/book/' + book + '/' + page + '/save';
  }
}
