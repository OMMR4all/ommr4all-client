export class ViewSettings {
  constructor(
    public showStaffLines = true,
    public showStaffGroupShading = false,
    public showLayout = false,
    public showSymbols = true,
    public showBoundingBoxes = false,
    public showReadingOrder = false,
    public showAnnotations = true,
    public showComments = true,

    public showBackground = true,
    public showSymbolCenterOnly = false,
    public showSymbolConfidence= false,
    public showAlternateSymbolsView= false,

    public showRenderedView = false,

    public showDocumentStartView = false,

    // area each position in staff claims; appended, every tool passes these positionally
    public showPisArea = false,
  ) {
  }

  copy(): ViewSettings {
    return Object.assign({}, this) as ViewSettings;
  }
}
