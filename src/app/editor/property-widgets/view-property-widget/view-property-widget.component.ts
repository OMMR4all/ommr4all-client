import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
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

}