export enum ActionType {
  // General
  Undefined = 0,
  Undo = 1,
  Redo = 2,

  CleanAll = 3,

  Polyline = 20,
  PolylineNew,
  PolylineInsert,
  PolylineDelete,
  PolylineSubtract,
  PolylineSelect,
  PolylineEdit,

  // Staff lines ( line editor)
  StaffLines = 100,
  StaffLinesNew = StaffLines + PolylineNew,
  StaffLinesNewPoint = StaffLines + PolylineInsert,
  StaffLinesDelete = StaffLines + PolylineDelete,
  StaffLinesEditPoints = StaffLines + PolylineEdit,

  StaffLinesEditPath,
  StaffLinesAutomatic,
  StaffLinesDeleteAll,
  StaffLinesGroup,
  StaffLinesSplit,

  // Layout
  Layout = 200,
  LayoutNew = Layout + PolylineNew,
  LayoutInsert = Layout + PolylineInsert,
  LayoutDelete = Layout + PolylineDelete,
  LayoutSubtract = Layout + PolylineSubtract,
  LayoutSelect = Layout + PolylineSelect,
  LayoutEdit = Layout + PolylineEdit,

  LayoutAutomatic,
  LayoutNewRegion,
  LayoutExtractCC,
  LayoutLassoArea,
  LayoutChangeType,
  LayoutJoin,

  // Symbols
  Symbols = 300,
  SymbolsDrag,
  SymbolsDelete,
  SymbolsInsert,
  SymbolsMove,
  SymbolsSortOrder,
  SymbolsChangeGraphicalConnection,
  SymbolsChangeNeumeStart,
  SymbolsDeleteAll,
  SymbolsAutomatic,

  // Lyrics
  Lyrics = 400,
  LyricsEdit,
  LyricsNextTextContainer,
  LyricsPrevTextContainer,
  LyricsDeselect,

  // Syllables
  Syllables = 500,
  SyllablesSelectNext,
  SyllablesSelectPrev,
  SyllablesAddToNeume,
  SyllabelsDeleteConnection,
}
