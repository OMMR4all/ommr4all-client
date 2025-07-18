export enum ActionType {
  // General
  Undefined = 0,
  Undo = 1,
  Redo = 2,

  CleanAll = 3,

  Locked,
  Unlocked,
  LockAll,

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

  StaffLinesHighlight,
  StaffLinesDryPointLine,
  // Layout
  Layout = 200,
  LayoutNew = Layout + PolylineNew,
  LayoutInsert = Layout + PolylineInsert,
  LayoutDelete = Layout + PolylineDelete,
  LayoutSubtract = Layout + PolylineSubtract,
  LayoutSelect = Layout + PolylineSelect,
  LayoutEdit = Layout + PolylineEdit,
  LayoutDeleteAll,
  LayoutRegionSplit,

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
  SymbolsChangeNoteType,
  SymbolsChangeGraphicalConnection,
  SymbolsChangeNeumeStart,
  SymbolsChangeFixedSorting,
  SymbolsChangedMissing,
  SymbolsDeleteAll,
  SymbolsAutomatic,
  SymbolsResetGraphicalConnections,
  SymbolsResetLogicalConnections,
  SymbolsAutoInsertNeumeStart,
  SymbolsChangeType,
  SymbolsChangeErrorType,
  SymbolsCopyArea,
  SymbolChangeAdvancedSymbolClass,
  SymbolChangeAdvancedSymbolColor,
  // Lyrics
  Lyrics = 400,
  LyricsEdit,
  LyricsNextTextContainer,
  LyricsPrevTextContainer,
  LyricsSelect,
  LyricsDeselect,
  LyricsClean,

  LyricDocumentStart,
  LyricSimilarDocumentText,
  // Syllables
  Syllables = 500,
  SyllablesSelectNext,
  SyllablesSelectPrev,
  SyllablesAddToNeume,
  SyllabelsDeleteConnection,
  SyllablesAutomatic,
  SyllablesClearConnections,


  // Reading Order
  ReadingOrder = 600,
  ReadingOrderDrag,
  ReadingOrderAuto,

  // Comments
  Comments = 700,
  CommentsAdded,
  CommentsDeleted,
  CommentsText,
  CommentsArea,
}
