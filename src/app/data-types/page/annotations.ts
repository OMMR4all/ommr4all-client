import {Syllable} from './syllable';
import {Note} from './music-region/symbol';
import {Page} from './page';
import {Block} from './block';
import {PageLine} from './pageLine';

export class Annotations {
  public connections: Array<Connection> = [];
  constructor(
    private _page: Page,
  ) {
  }

  static fromJson(json, page: Page) {
    const a = new Annotations(
      page,
    );
    if (!json) { return a; }
    a.connections = json.connections.map(c => Connection.fromJson(c, a));
    return a;
  }

  toJson() {
    return {
      connections: this.connections.map(c => c.toJson()),
    };
  }

  get page() { return this._page; }

  findSyllableConnectorByNote(note: Note): SyllableConnector {
    if (!note) { return null; }
    for (const c of this.connections.filter(con => con.musicRegion === note.staff.getBlock())) {
      const sc = c.syllableConnectors.find(s => s.neume === note);
      if (sc) { return sc; }
    }
    return null;
  }

  findSyllableConnector(line: PageLine, syllable: Syllable): SyllableConnector {
    if (!syllable) { return null; }
    for (const c of this.connections.filter(con => con.textRegion === line.getBlock())) {
      const sc = c.syllableConnectors.find(s => s.syllable === syllable);
      if (sc) { return sc; }
    }
    return null;
  }

}

export class Connection {
  constructor(
    private _annotations: Annotations,
    public musicRegion: Block,
    public textRegion: Block,
    public syllableConnectors: Array<SyllableConnector> = [],
  ) {}

  static fromJson(json, annotations: Annotations) {
    const page = annotations.page;
    const mr = page.musicRegionById(json.musicID);
    const tr = page.textRegionById(json.textID);
    const c = new Connection(
      annotations,
      mr, tr,
    );
    c.syllableConnectors = json.syllableConnectors.map(sc => SyllableConnector.fromJson(sc, c, tr, mr));
    return c;
  }

  get annotations() { return this._annotations; }

  toJson() {
    return {
      musicID: this.musicRegion.id,
      textID: this.textRegion.id,
      syllableConnectors: this.syllableConnectors.map(sc => sc.toJson()),
    };
  }

}

export class SyllableConnector {
  constructor(
    private _connection: Connection,
    public syllable: Syllable,
    public neume: Note,
    public textLine: PageLine,
  ) {}

  static fromJson(json, connection: Connection, textRegion: Block, musicRegion: Block) {
    const si = textRegion.syllableInfoById(json.syllableID);
    const sc = new SyllableConnector(
      connection,
      si.s,
      musicRegion.noteById(json.neumeID.replace('neume', 'note')),
      si.l,
    );
    return sc;
  }

  get connection() { return this._connection; }

  toJson() {
    return {
      syllableID: this.syllable.id,
      neumeID: this.neume.id.replace('note', 'neume'),
    };
  }
}
