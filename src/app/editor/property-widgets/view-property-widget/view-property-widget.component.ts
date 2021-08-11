import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {ViewSettings} from '../../sheet-overlay/views/view';

@Component({
  selector: 'app-view-property-widget',
  templateUrl: './view-property-widget.component.html',
  styleUrls: ['./view-property-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPropertyWidgetComponent implements OnInit {
  @Input() viewSettings: ViewSettings = null;
  @Output() viewSettingsChange = new EventEmitter<ViewSettings>();
  @Output() resetToDefault = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  get showStaffLines() { return this.viewSettings.showStaffLines; }
  get showStaffGroupShading() { return this.viewSettings.showStaffGroupShading; }
  get showSymbols() { return this.viewSettings.showSymbols; }
  get showLayout() { return this.viewSettings.showLayout; }
  get showBoundingBoxes() { return this.viewSettings.showBoundingBoxes; }
  get showReadingOrder() { return this.viewSettings.showReadingOrder; }
  get showAnnotations() { return this.viewSettings.showAnnotations; }
  get showComments() { return this.viewSettings.showComments; }
  get showBackground() { return this.viewSettings.showBackground; }
  get showSymbolsCenterOnly() { return this.viewSettings.showSymbolCenterOnly; }
  get showSymbolsConfidence() { return this.viewSettings.showSymbolConfidence; }

  set showStaffLines(show: boolean) {
    if (show === this.showStaffLines) { return; }
    this.viewSettings.showStaffLines = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }
  set showSymbols(show: boolean) {
    if (this.showSymbols !== show) {
      this.viewSettings.showSymbols = show;
      this.viewSettingsChange.emit(this.viewSettings);
    }
  }
  set showLayout(show: boolean) {
    if (this.showLayout === show) { return; }
    this.viewSettings.showLayout = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }
  set showStaffGroupShading(show: boolean) {
    if (this.showStaffGroupShading === show) { return; }
    this.viewSettings.showStaffGroupShading = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }

  set showBoundingBoxes(show: boolean) {
    if (this.showBoundingBoxes === show) { return; }
    this.viewSettings.showBoundingBoxes = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }

  set showReadingOrder(show: boolean) {
    if (this.showReadingOrder === show) { return; }
    this.viewSettings.showReadingOrder = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }

  set showAnnotations(show: boolean) {
    if (this.showAnnotations === show) { return; }
    this.viewSettings.showAnnotations = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }

  set showComments(show: boolean) {
    if (this.showComments === show) { return; }
    this.viewSettings.showComments = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }

  set showBackground(show: boolean) {
    if (this.showBackground === show) { return; }
    this.viewSettings.showBackground = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }
  set showSymbolsConfidence(show: boolean) {
    if (this.showSymbolsConfidence === show) { return; }
    this.viewSettings.showSymbolConfidence = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }
  set showSymbolsCenterOnly(show: boolean) {
    if (this.showSymbolsCenterOnly === show) { return; }
    this.viewSettings.showSymbolCenterOnly = show;
    this.viewSettingsChange.emit(this.viewSettings);
  }
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
      if (event.code === 'KeyF' ) {
        this.showSymbols = !this.viewSettings.showSymbols;
        event.preventDefault();
  }

}
}
