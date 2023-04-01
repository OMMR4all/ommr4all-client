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
    public showSymbolConfidence= true,

    public showRenderedView = false,

    public showDocumentStartView = false,
  ) {
  }

  copy(): ViewSettings {
    return Object.assign({}, this) as ViewSettings;
  }
}
