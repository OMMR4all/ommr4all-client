import { Component, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {forkJoin} from 'rxjs';
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
  globalSettings = inject(GlobalSettingsService);
  auth = inject(AuthenticationService);

  P = GlobalPermissions;
  public apiError = null;

  styles: BookStyle[] = [];
  rows: Row[] = [];
  displayedColumns: string[] = ['step'];

  @ViewChildren(ModelForStyleSelectComponent) modelSelections: QueryList<ModelForStyleSelectComponent>;

  ngOnInit() {
    this.globalSettings.bookStylesObs.subscribe(styles => {
      this.styles = styles || [];
      this.displayedColumns = ['step', ...this.styles.map(s => s.id)];
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
