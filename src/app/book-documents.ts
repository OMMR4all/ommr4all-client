import {RestAPIUser, unknownRestAPIUser} from './authentication/user';
import {Syllable} from './data-types/page/syllable';
import {BookCommunication, PageCommunication} from './data-types/communication';

export class DocumentConnection {
  constructor(
    // tslint:disable-next-line:variable-name
    public line_id: string = '',
    // tslint:disable-next-line:variable-name
    public page_id: string = '',
    // tslint:disable-next-line:variable-name
    public page_name: string = '',
    public row: number = null,
  ) {
  }
  static fromJson(json) {
    return new DocumentConnection(
      json.line_id,
      json.page_id,
      json.page_name,
      json.row,
    );
  }

  toJson() {
    return {
      line_id: this.line_id,
      page_id: this.page_id,
      page_name: this.page_name,
      row: this.row,

    };
  }
}

export class DocumentMetaInfos {
  constructor(
    // tslint:disable-next-line:variable-name
    public cantus_id: string = '',
    public initium: string = '',
    public genre: string = '',
    public url: string = '',
    // tslint:disable-next-line:variable-name
    public dataset_source: string = '',
    public festum: string = '',
  ) {
  }
  static fromJson(json) {
    return new DocumentMetaInfos(
      json.cantus_id,
      json.initium,
      json.genre,
      json.url,
      json.dataset_source,
      json.festum,
    );
  }
  toJson() {
    return {
      cantus_id: this.cantus_id,
      initium: this.initium,
      genre: this.genre,
      url: this.url,
      dataset_source: this.dataset_source,
      festum: this.festum,
    };
  }
}
export class Document {
  constructor(
    // tslint:disable-next-line:variable-name
    public monody_id: string = '',
    // tslint:disable-next-line:variable-name
    public doc_id: string = '',
    // tslint:disable-next-line:variable-name
    public page_ids: Array<string> = [],
    // tslint:disable-next-line:variable-name
    public pages_names: Array<string> = [],
    // tslint:disable-next-line:variable-name
    public end_point: DocumentConnection = new DocumentConnection(),
    // tslint:disable-next-line:variable-name
    public start_point: DocumentConnection = new DocumentConnection(),
    //
    public textinitium: string = '',

    public textline_count: number = 0,
    public document_meta_infos: DocumentMetaInfos = new DocumentMetaInfos(),
    public pageCommunications: Array<PageCommunication> = []

) {
  }


  static fromJson(json) {
    return new Document(
      json.monody_id,
      json.doc_id,
      json.page_ids,
      json.pages_names,
      DocumentConnection.fromJson(json.end_point),
      DocumentConnection.fromJson(json.start_point),
      json.textinitium,
      json.textline_count,
      DocumentMetaInfos.fromJson(json.document_meta_infos)
    );
  }

  loadPageCommunications(book: BookCommunication) {
    if (this.pageCommunications.length === 0) {
      this.pageCommunications = this.pages_names.map(page => new PageCommunication(book, page));
    }
    return this.pageCommunications;
  }

  toJson() {
    return {
      monody_id: this.monody_id,
      doc_id: this.doc_id,
      page_ids: this.page_ids,
      pages_names: this.pages_names,
      end_point: this.end_point.toJson(),
      start_point: this.start_point.toJson(),
      textinitium: this.textinitium,
      textline_count: this.textline_count,
      document_meta_infos: this.document_meta_infos.toJson(),
    };
  }
}
export class Documents {
  constructor(
    public documents: Array<Document> = []
  ) {
  }
  static fromJson(json) {
    return new Documents(
      json.documents ? json.documents.map(d => Document.fromJson(d)) : [],
    );
  }

  toJson() {
    return {
      documents: this.documents.map(d => d.toJson()),
    };
  }

  getDocumentbyLineidAndPage(id, page) {
    return this.documents.find(doc => doc.start_point.line_id === id && doc.start_point.page_name === page);

  }
}

export class BookDocuments {
  constructor(
    // tslint:disable-next-line:variable-name
    public p_id = '',
    public name = '',
    public created = new Date(Date.now()).toISOString(),
    // tslint:disable-next-line:variable-name
    public database_documents: Documents = new Documents()

  ) {
  }


  static fromJson(json) {
    return new BookDocuments(
      json.p_id,
      json.name,
      json.created,
      Documents.fromJson(json.database_documents),
    );
  }

  toJson() {
    return {
      p_id: this.p_id,
      name: this.name,
      created: this.created,
      database_documents: this.database_documents.toJson(),

    };
  }

}
