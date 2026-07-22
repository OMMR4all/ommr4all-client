import { Component, inject, LOCALE_ID } from '@angular/core';
import {BookListService} from './book-list.service';
import {Router} from '@angular/router';
import {AuthenticationService} from './authentication/authentication.service';
import {UserIdleService} from './common/user-idle.service';
import {GlobalSettingsService} from './global-settings.service';
import { MatIconRegistry } from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {Location} from '@angular/common';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  private location = inject(Location);
  books = inject(BookListService);
  router = inject(Router);
  auth = inject(AuthenticationService);
  private userIdle = inject(UserIdleService);
  private globalSettings = inject(GlobalSettingsService);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private localeId = inject(LOCALE_ID);


  constructor() {
    const location = this.location;
    const userIdle = this.userIdle;
    const matIconRegistry = this.matIconRegistry;
    const domSanitizer = this.domSanitizer;

    userIdle.timeout.asObservable().subscribe((to) => { if (to) { this.auth.logout(); }});
    const icon = (i: string) => domSanitizer.bypassSecurityTrustResourceUrl(location.prepareExternalUrl('assets/icons/' + i + '.svg'));
    const addIcon = (i: string) => matIconRegistry.addSvgIcon(i, icon(i));
    ['clef_c', 'clef_f', 'accid_flat', 'accid_natural', 'accid_sharp', 'notes', 'note_separator',
      'edit_text',
      'group_stafflines', 'split_stafflines', 'edit_stafflines',
      'connected_component', 'lasso',
      'reading_order_auto', 'syllable_auto',

      'github', 'uniwue'
    ].forEach(i => addIcon(i));
  }

  get displayHeader() { return !(this.router.url.endsWith('/edit') || this.router.url.endsWith('/view')); }

  /** True when the currently served bundle is the German locale. */
  get isGerman() { return this.localeId.startsWith('de'); }

  /** Endonym of the language the button switches TO (needs no translation). */
  get otherLanguageLabel() { return this.isGerman ? 'English' : 'Deutsch'; }

  /**
   * Reload the current page under the other locale's URL prefix. The server serves
   * each locale as a separate build via Django i18n_patterns (base href "/en/" or "/de/"),
   * so switching means swapping the leading path segment and doing a full navigation.
   */
  switchLanguage() {
    const target = this.isGerman ? 'en' : 'de';
    const parts = window.location.pathname.split('/');
    if (parts[1] === 'en' || parts[1] === 'de') {
      parts[1] = target;
    } else {
      parts.splice(1, 0, target);
    }
    window.location.href = parts.join('/') + window.location.search + window.location.hash;
  }
}
