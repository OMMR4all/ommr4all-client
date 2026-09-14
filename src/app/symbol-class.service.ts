import {Injectable, inject} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {filter} from 'rxjs/operators';
import {ServerUrls} from './server-urls';
import {AuthenticationService} from './authentication/authentication.service';
import {
  descriptorFromDef,
  SYMBOL_CLASS_REGISTRY,
  SymbolClassDef,
  SymbolClassDescriptor,
  symbolClassKey,
} from './data-types/page/symbol-class-registry';
import {MusicSymbol} from './data-types/page/music-region/symbol';

/**
 * The effective symbol-class list: the built-in classes plus the classes an
 * administrator registered for the active notation style.
 *
 * `descriptors` and the backing map are memoised, because `descriptorOf` runs in
 * `symbol.component`'s change detection for every symbol on the page.
 */
@Injectable({providedIn: 'root'})
export class SymbolClassService {
  private http = inject(HttpClient);
  private authentication = inject(AuthenticationService);

  defsObs = new BehaviorSubject<SymbolClassDef[]>([]);
  get defs() { return this.defsObs.getValue(); }

  private _activeStyleId: string = null;
  private _descriptors: SymbolClassDescriptor[] = null;
  private _byKey: Map<string, SymbolClassDescriptor> = null;

  constructor() {
    this.reload();
    this.authentication.loggedInObs.pipe(
      filter(l => l)
    ).subscribe(() => this.reload());
  }

  public reload() {
    this.http.get<SymbolClassDef[]>(ServerUrls.symbolClasses()).subscribe(
      r => {
        this._descriptors = null;
        this._byKey = null;
        this.defsObs.next(Array.isArray(r) ? r : []);
      },
      err => console.error('Could not load the symbol classes', err)
    );
  }

  get activeStyleId() { return this._activeStyleId; }

  set activeStyleId(id: string) {
    if (this._activeStyleId !== id) {
      this._activeStyleId = id;
      this._descriptors = null;
      this._byKey = null;
    }
  }

  get descriptors(): SymbolClassDescriptor[] {
    if (!this._descriptors) {
      this._descriptors = this.descriptorsForStyle(this._activeStyleId);
    }
    return this._descriptors;
  }

  /** Built-ins plus the custom classes of `styleId` (and the style-independent ones). */
  public descriptorsForStyle(styleId: string): SymbolClassDescriptor[] {
    const customs = this.defs
      .filter(d => d.style === null || d.style === styleId)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      .map(descriptorFromDef);
    return SYMBOL_CLASS_REGISTRY.concat(customs);
  }

  public descriptorOf(symbol: MusicSymbol): SymbolClassDescriptor {
    if (!this._byKey) {
      this._byKey = new Map<string, SymbolClassDescriptor>();
      // built-ins first, so a custom class never shadows the base-class rendering
      for (const d of this.descriptors) {
        this._byKey.set(symbolClassKey(d.symbolType, d.subType, d.classId), d);
      }
    }
    return this._byKey.get(symbolClassKey(symbol.symbol, symbol.subType, symbol.symbolClass));
  }
}
