import {MusicRegion} from './music-region/music-region';
import {TextRegion, TextRegionType} from './text-region';
import {Syllable} from './syllable';
import {Note} from './music-region/symbol';
import {Page} from './page';
import {TextLine} from './text-line';

export class Annotations {
  public connections: Array<Connection> = [];
  constructor(
    private _page: Page)
  {}

  addNeumeConnection(neume: Note, syllable: Syllable) {
    if (!neume || !syllable) { return; }
    const mr = neume.staff.parentOfType(MusicRegion) as MusicRegion;
    let line: TextLine = null;
    const tr = this._page.textRegions.filter(t => t.type === TextRegionType.Lyrics).find(
      t => {line = t.textLines.find(tl => tl.words.findIndex(w => w.syllabels.indexOf(syllable) >= 0) >= 0);
      return line !== undefined;}
    );
    if (mr === undefined) { console.error('Note without a music region', neume); return; }
    if (tr === undefined) { console.error('Syllable without a text region', syllable); return; }

    const c = this.getOrCreateConnection(mr, tr);
    const s = c.getOrCreateSyllableConnector(syllable);
    s.getOrCreateNeumeconnector(neume, line);
  }

  getOrCreateConnection(mr: MusicRegion, tr: TextRegion) {
    const c = this.connections.find(co => co.musicRegion === mr && co.textRegion === tr);
    if (c) { return c; }
    this.connections.push(new Connection(mr, tr));
    return this.connections[this.connections.length - 1];
  }

}

export class Connection {
  constructor(
      public musicRegion: MusicRegion,
      public textRegion: TextRegion,
      public syllableConnectors: Array<SyllableConnector> = [],
  ) {}

  getOrCreateSyllableConnector(s: Syllable) {
    const syl = this.syllableConnectors.find(sc => sc.syllable === s);
    if (syl) { return syl; }
    this.syllableConnectors.push(new SyllableConnector(s));
    return this.syllableConnectors[this.syllableConnectors.length - 1];
  }
}

export class SyllableConnector {
  constructor(
    public syllable: Syllable,
    public neumeConnectors: Array<NeumeConnector> = [],
  ) {}

  getOrCreateNeumeconnector(n: Note, tl: TextLine) {
    const nc = this.neumeConnectors.find(c => c.neume === n);
    if (nc) { return nc; }
    this.neumeConnectors.push(new NeumeConnector(n, tl));
    return this.neumeConnectors[this.neumeConnectors.length - 1];
  }

  removeConnector(n: NeumeConnector) {
    if (!n) { return; }
    const idx = this.neumeConnectors.indexOf(n);
    if (idx >= 0) { this.neumeConnectors.splice(idx, 1); }
  }
}

export class NeumeConnector {
  constructor(
    public neume: Note,
    public textLine: TextLine,
  ) {}
}
