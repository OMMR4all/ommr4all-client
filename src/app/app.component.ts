import {Component} from '@angular/core';
import {BookListService} from './book-list.service';
import {Router} from '@angular/router';
import {AuthenticationService} from './authentication/authentication.service';
import {UserIdleService} from './common/user-idle.service';
import {GlobalSettingsService} from './global-settings.service';
import {MatIconRegistry} from '@angular/material';
import {DomSanitizer} from '@angular/platform-browser';
import {Location} from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    private location: Location,
    public books: BookListService,
    public router: Router
    ,
    public auth: AuthenticationService,
    private userIdle: UserIdleService,
    private globalSettings: GlobalSettingsService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
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

  get displayHeader() { return !this.router.url.endsWith('/edit'); }
}
