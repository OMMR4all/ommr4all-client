import {TextEquiv} from './text-equiv';
import {Rect} from '../../geometry/geometry';
import {Region} from './region';

export enum BlockType {
  Paragraph = 0,
  Heading,
  Lyrics,
  DropCapital,

  Music,
}

export enum EmptyMusicRegionDefinition {
  HasSymbols = 1,
  HasDimension = 2,
  HasStaffLines = 4,

  Default = HasSymbols | HasDimension | HasStaffLines,   // tslint:disable-line no-bitwise
}

export enum EmptyTextRegionDefinition {
  HasText = 1,
  HasDimension = 2,
  HasTextLines = 4,

  Default = HasText | HasDimension | HasTextLines,   // tslint:disable-line no-bitwise
}

export enum SymbolType {
  Note = 0,
  Clef = 1,
  Accid = 2,

  LogicalConnection = 10,  // No internal symbol, but generated object
}

export enum StaffEquivIndex {
  Default = 0,
}

export enum TextEquivIndex {
  OCR_GroundTruth = 0,
  Syllables = 1,
}

export enum AccidentalType {
  Natural = 0,
  Sharp = 1,
  Flat = -1,
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

  Up = 101,
  Down = 99,
  Equal = 100,
}

export enum NoteType {
  Normal = 0,
}

export enum GraphicalConnectionType {
  Gaped = 0,
  Looped = 1,
}

export enum ClefType {
  Clef_F = 0,
  Clef_C = 1,
}

export enum SyllableConnectionType {
  Visible = 0,
  Hidden = 1,
  New = 2,
}

