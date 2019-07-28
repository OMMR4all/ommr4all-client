import {Component, OnInit, QueryList, ViewChildren} from '@angular/core';
import {GlobalSettingsService} from '../../global-settings.service';
import {ModelForStyleSelectComponent} from '../../common/model-for-style-select/model-for-style-select.component';
import {forkJoin} from 'rxjs';
import {ApiError} from '../../utils/api-error';
import {AuthenticationService, GlobalPermissions} from '../../authentication/authentication.service';

interface AlgorithmGroupView {
  url: string;
  display: string;
}

@Component({
  selector: 'app-administrative-view-default-models',
  templateUrl: './administrative-view-default-models.component.html',
  styleUrls: ['./administrative-view-default-models.component.scss']
})
export class AdministrativeViewDefaultModelsComponent implements OnInit {
  P = GlobalPermissions;
  public apiError = null;
  readonly algorithmGroups = new Array<AlgorithmGroupView>(
    {url: 'stafflines', display: 'Staff lines'},
    {url: 'symbols', display: 'Symbols'},
  );

  readonly displayedColumns = [
    'id', 'name', ...this.algorithmGroups.map(a => a.url),
  ];

  @ViewChildren(ModelForStyleSelectComponent) modelSelections: QueryList<ModelForStyleSelectComponent>;

  constructor(
    public globalSettings: GlobalSettingsService,
    public auth: AuthenticationService,
  ) { }

  ngOnInit() {
  }


  reset() {
    this.modelSelections.forEach(m => {
      m.reset();
    });
  }

  save() {
    forkJoin(
      this.modelSelections.map(m => m.saveCall()).filter(c => !!c)
    ).subscribe(
      r => r,
      error => this.apiError = error.error as ApiError,
    );
  }

}
