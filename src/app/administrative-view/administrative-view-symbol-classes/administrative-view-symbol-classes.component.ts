import { Component, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import {Subscription} from 'rxjs';
import {BookStyle, GlobalSettingsService} from '../../global-settings.service';
import {ServerUrls} from '../../server-urls';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../utils/api-error';
import {AuthenticationService, GlobalPermissions} from '../../authentication/authentication.service';
import {ConfirmDialogComponent, ConfirmDialogModel} from '../../common/confirm-dialog/confirm-dialog.component';
import {SymbolClassService} from '../../symbol-class.service';
import {
  descriptorFromDef,
  SYMBOL_CLASS_REGISTRY,
  SymbolClassDef,
  SymbolClassDescriptor,
} from '../../data-types/page/symbol-class-registry';
import {NoteType, SymbolType} from '../../data-types/page/definitions';
import {SymbolClassDialogComponent} from './symbol-class-dialog/symbol-class-dialog.component';

/** One table row: a built-in class or a runtime-registered one. */
export interface SymbolClassRow {
  descriptor: SymbolClassDescriptor;
  /** The server object of a registered class, null for a built-in. */
  def: SymbolClassDef;
  builtin: boolean;
}

@Component({
    selector: 'app-administrative-view-symbol-classes',
    templateUrl: './administrative-view-symbol-classes.component.html',
    styleUrls: ['./administrative-view-symbol-classes.component.scss'],
    standalone: false
})
export class AdministrativeViewSymbolClassesComponent implements OnDestroy {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private authentication = inject(AuthenticationService);
  settings = inject(GlobalSettingsService);
  symbolClasses = inject(SymbolClassService);

  apiError: ApiError;
  displayedColumns = ['preview', 'toolbar', 'name', 'id', 'base', 'style', 'shortcut', 'actions'];
  /** null = show the classes of every notation style */
  styleFilter: string = null;
  rows: SymbolClassRow[] = [];

  private subscription: Subscription;

  constructor() {
    this.subscription = this.symbolClasses.defsObs.subscribe(() => this.updateRows());
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get bookStyles(): BookStyle[] { return this.settings.bookStyles; }
  get mayAdd() { return this.authentication.hasPermission(GlobalPermissions.AddSymbolClass); }
  get mayEdit() { return this.authentication.hasPermission(GlobalPermissions.EditSymbolClass); }
  get mayDelete() { return this.authentication.hasPermission(GlobalPermissions.DeleteSymbolClass); }

  /** False while only the built-in classes exist, which is what a fresh installation shows. */
  get hasCustomSymbols() { return this.rows.some(r => !r.builtin); }

  onStyleFilter(styleId: string) {
    this.styleFilter = styleId;
    this.updateRows();
  }

  private updateRows() {
    const builtin: SymbolClassRow[] = SYMBOL_CLASS_REGISTRY.map(
      d => ({descriptor: d, def: null, builtin: true}));
    const custom: SymbolClassRow[] = this.symbolClasses.defs
      // the "all styles" filter shows every class, a concrete style also shows the global ones
      .filter(d => this.styleFilter === null || d.style === null || d.style === this.styleFilter)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      .map(d => ({descriptor: descriptorFromDef(d), def: d, builtin: false}));
    this.rows = builtin.concat(custom);
  }

  /** Base class of a row, as `<symbol type> / <sub type>`. */
  baseLabel(row: SymbolClassRow): string {
    const symbolType = row.def ? row.def.base_symbol_type : row.descriptor.symbolType;
    const subType = row.def ? row.def.base_sub_type : row.descriptor.subType;
    if (symbolType === SymbolType.Note) {
      // the note type travels as its numeric enum value
      const name = NoteType[Number(subType)];
      return symbolType + ' / ' + (name ? name : String(subType));
    }
    return symbolType + ' / ' + String(subType);
  }

  styleLabel(row: SymbolClassRow): string {
    if (!row.def) { return ''; }
    if (row.def.style === null) { return $localize`All styles`; }
    const style = this.settings.bookStyleById(row.def.style);
    return style ? style.name : row.def.style;
  }

  shortcutLabel(row: SymbolClassRow): string {
    const digit = row.def ? row.def.digit_shortcut : row.descriptor.digitShortcut;
    return digit === null || digit === undefined ? '-' : String(digit);
  }

  add() {
    this.dialog.open(SymbolClassDialogComponent, {
      maxWidth: '860px',
      data: {def: null},
    }).afterClosed().subscribe(changed => {
      if (changed) { this.symbolClasses.reload(); }
    });
  }

  edit(def: SymbolClassDef) {
    this.dialog.open(SymbolClassDialogComponent, {
      maxWidth: '860px',
      data: {def},
    }).afterClosed().subscribe(changed => {
      if (changed) { this.symbolClasses.reload(); }
    });
  }

  delete(def: SymbolClassDef) {
    const message = $localize`Delete the symbol class "${def.name}"? Existing annotations keep its ` +
      $localize`class id and render as their base class until the class is registered again.`;
    const dialogData = new ConfirmDialogModel($localize`Confirm`, message);

    this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: dialogData,
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.http.delete(ServerUrls.symbolClasses() + '/' + def.id).subscribe(
          () => {
            this.symbolClasses.reload();
          },
          err => {
            this.apiError = apiErrorFromHttpErrorResponse(err);
          }
        );
      }
    });
  }
}
