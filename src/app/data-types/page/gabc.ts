import {
  GraphicalConnectionType,
  SymbolType,
  pisGabcMapping,
  pisGabcClefMapping,
  typeGabcAccMapping,
} from './definitions';
// Type-only: importing these for real would close the cycle gabc -> symbol -> pageLine -> gabc.
// definitions.ts is a leaf module, so it is safe to import as a value.
import type {Accidental, Clef, MusicSymbol, Note} from './music-region/symbol';
import type {Page} from './page';

/**
 * Builds the GABC source of a sequence of music symbols. Shared by Block (all symbols of all its
 * music lines) and PageLine (the symbols of a single staff) so both render identically.
 */
export function gabcFromSymbols(symbols: MusicSymbol[], page: Page): string {
  const noDropCapital = 'initial-style: 0; %%';

  let gabcString = '';
  gabcString += noDropCapital;
  let neume = false;
  let gabc_accString = '';
  let first_note = true;
  symbols.forEach(symbol => {
    if (symbol.symbol === SymbolType.Note) {
      const noteSymbol = symbol as Note;
      if (noteSymbol.isNeumeStart || first_note) {
        if (neume) {
          gabcString += ':?) ';
        }
        first_note = false;
        neume = true;
        const syllable = page ? page.annotations.findSyllableConnectorByNote(noteSymbol) : null;
        if (syllable) {
          gabcString += syllable.syllable.connectionStr + syllable.syllable.text;
        }
        else {
          gabcString += '-';

        }
        gabcString += '(';
      }
      let connection = '';
      if (noteSymbol.graphicalConnection === GraphicalConnectionType.Gaped) {
        connection = '!';
      }
      gabcString += gabc_accString + connection + pisGabcMapping.get(noteSymbol.getPositionInStaff);
      gabc_accString = '';

    }
    if (symbol.symbol === SymbolType.Clef) {
      const clefSymbol = symbol as Clef;
      if (neume) {
        gabcString += ':?) ';
      }
      gabcString += '(' + clefSymbol.type.toString() + pisGabcClefMapping.get(clefSymbol.getPositionInStaff) + ') ';
      neume = false;

    }
    if (symbol.symbol === SymbolType.Accid) {
      const accsymbol = symbol as Accidental;

      gabc_accString += pisGabcMapping.get(accsymbol.getPositionInStaff) + typeGabcAccMapping.get(accsymbol.type);

    }
  });
  if (gabcString.length > 0) {
    gabcString += ':?)';
  }
  return gabcString;
}
