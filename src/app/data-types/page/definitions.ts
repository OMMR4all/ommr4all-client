export class Constants {
  static readonly GLOBAL_SCALING = 1000;
}

export enum BlockType {
  Paragraph = 'paragraph',
  Heading = 'heading',
  Lyrics = 'lyrics',
  DropCapital = 'dropCapital',
  FolioNumber = 'folioNumber',

  Music = 'music',
}

export class BlockTypeUtil {
  static readonly css = {
    paragraph: 'paragraph',
    heading: 'heading',
    lyrics: 'lyrics',
    dropCapital: 'drop-capital',
    folioNumber: 'folio-number',
    music: 'music',
  };
}

export enum EmptyRegionDefinition {
  HasSymbols = 1,
  HasDimension = 2,
  HasStaffLines = 4,
  HasLines = 8,
  HasText = 16,

  Default = HasSymbols | HasDimension | HasStaffLines | HasLines | HasText,   // tslint:disable-line no-bitwise
}

export enum SymbolType {
  Note = 'note',
  Clef = 'clef',
  Accid = 'accid',

  LogicalConnection = 'logicalConnection',  // No internal symbol, but generated object
}

export enum TextEquivIndex {
  OCR_GroundTruth = 0,
  Syllables = 1,
}

export enum AccidentalType {
  Natural = 'natural',
  Sharp = 'sharp',
  Flat = 'flat',
}

export enum MusicSymbolPositionInStaff {
  Undefined = -1000,

  Space_0 = 0,
  Line_0 = 1,
  Space_1 = 2,
  Line_1 = 3,
  Space_2 = 4,
  Line_2 = 5,
  Space_3 = 6,
  Line_3 = 7,
  Space_4 = 8,
  Line_4 = 9,
  Space_5 = 10,
  Line_5 = 11,
  Space_6 = 12,
  Line_6 = 13,
  Space_7 = 14,

  Min = Space_0,
  Max = Space_7,

  Up = 101,
  Down = 99,
  Equal = 100,
}

export enum NoteType {
  Normal = 0,
  Oriscus = 1,
  Apostropha = 2,
  LiquescentFollowingU = 3,
  LiquescentFollowingD = 4,
}

export enum GraphicalConnectionType {
  Gaped = 0,
  Looped = 1,

  NeumeStart = 2,
}

export enum ClefType {
  Clef_F = 'f',
  Clef_C = 'c',
}

export enum SyllableConnectionType {
  Visible = 0,
  Hidden = 1,
  New = 2,
}

