import { Component, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import {GlobalSettingsService} from '../../global-settings.service';
import {ModelForStyleSelectComponent} from '../../common/algorithm-steps/model-for-style-select/model-for-style-select.component';
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
    styleUrls: ['./administrative-view-default-models.component.scss'],
    standalone: false
})
export class AdministrativeViewDefaultModelsComponent implements OnInit {
  globalSettings = inject(GlobalSettingsService);
  auth = inject(AuthenticationService);

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
