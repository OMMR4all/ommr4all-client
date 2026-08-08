import { Component, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import {forkJoin} from 'rxjs';
import {ConfirmDialogComponent, ConfirmDialogModel} from '../../common/confirm-dialog/confirm-dialog.component';
import {GlobalSettingsService, BookStyle} from '../../global-settings.service';
import {ModelForStyleSelectComponent} from '../../common/algorithm-steps/model-for-style-select/model-for-style-select.component';
import {ApiError} from '../../utils/api-error';
import {AuthenticationService, GlobalPermissions} from '../../authentication/authentication.service';
import {ServerUrls} from '../../server-urls';
import {
  AlgorithmGroups,
  AlgorithmTypes,
  labelForAlgorithmGroup,
  metaForAlgorithmType,
} from '../../book-view/book-step/algorithm-predictor-params';

/** One configurable default model, as offered by the server. */
interface DefaultModelSlot {
  type: string;
  group: string;
  model_dir: string;
  // types sharing this model directory; they are configured by this slot as well
  aliases: string[];
}

interface SlotsResponse {
  slots: DefaultModelSlot[];
}

// a group header row, or one algorithm with a select per book style
interface GroupRow { group: string; label: string; }
interface SlotRow { slot: DefaultModelSlot; label: string; aliases: string; }
type Row = GroupRow | SlotRow;

@Component({
    selector: 'app-administrative-view-default-models',
    templateUrl: './administrative-view-default-models.component.html',
    styleUrls: ['./administrative-view-default-models.component.scss'],
    standalone: false
})
export class AdministrativeViewDefaultModelsComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  globalSettings = inject(GlobalSettingsService);
  auth = inject(AuthenticationService);

  P = GlobalPermissions;
  public apiError = null;

  styles: BookStyle[] = [];
  // only one style is shown at a time: a column per style does not scale to a server with many
  selectedStyle: string = null;
  // what the picker shows; only committed to selectedStyle once pending edits are resolved
  pickedStyle: string = null;
  rows: Row[] = [];
  readonly displayedColumns = ['step', 'model'];

  @ViewChildren(ModelForStyleSelectComponent) modelSelections: QueryList<ModelForStyleSelectComponent>;

  ngOnInit() {
    this.globalSettings.bookStylesObs.subscribe(styles => {
      this.styles = styles || [];
      if (!this.styles.find(s => s.id === this.selectedStyle)) {
        this.selectedStyle = this.styles.length > 0 ? this.styles[0].id : null;
        this.pickedStyle = this.selectedStyle;
      }
    });
    this.http.get<SlotsResponse>(ServerUrls.administrative('default_models/slots')).subscribe(
      r => this.rows = this.toRows(r.slots),
      error => this.apiError = error.error as ApiError,
    );
  }

  /** The slots of one group, preceded by a header row naming that group. */
  private toRows(slots: DefaultModelSlot[]): Row[] {
    const rows = new Array<Row>();
    let group: string = null;
    slots.forEach(slot => {
      if (slot.group !== group) {
        group = slot.group;
        rows.push({group, label: labelForAlgorithmGroup.get(group as AlgorithmGroups) || group});
      }
      rows.push({
        slot,
        label: this.labelForType(slot.type),
        aliases: slot.aliases.map(a => this.labelForType(a)).join(', '),
      });
    });
    return rows;
  }

  private labelForType(type: string): string {
    const meta = metaForAlgorithmType.get(type as AlgorithmTypes);
    // an algorithm the client does not know by name is still configurable
    return meta ? meta.label : type;
  }

  isGroup(index: number, row: Row) { return 'group' in row; }

  get isDirty() { return !!this.modelSelections && this.modelSelections.some(m => m.isDirty); }

  /** Switching the style reloads every select, so pending edits would be lost silently. */
  changeStyle(style: string) {
    this.pickedStyle = style;
    if (!this.isDirty) {
      this.selectedStyle = style;
      return;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: new ConfirmDialogModel('Discard changes',
        'The default models of this style were changed but not saved. Discard the changes?'),
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      // pickedStyle drives the select, so writing the old value back also resets the control
      this.pickedStyle = confirmed ? style : this.selectedStyle;
      this.selectedStyle = this.pickedStyle;
    });
  }

  reset() {
    this.modelSelections.forEach(m => {
      m.reset();
    });
  }

  save() {
    const calls = this.modelSelections.map(m => m.saveCall()).filter(c => !!c);
    if (calls.length === 0) { return; }
    forkJoin(calls).subscribe(
      r => r,
      error => this.apiError = error.error as ApiError,
    );
  }

}
