import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookCommunication} from '../../data-types/communication';
import {BookMeta} from '../../book-list.service';
import {filter} from 'rxjs/operators';
import {BookPermissionFlag, BookPermissionFlags, BookPermissions} from '../../data-types/permissions';
import {RestAPIGroup, RestAPIUser} from '../../authentication/user';
import {ServerUrls} from '../../server-urls';
import { MatSelectChange } from '@angular/material/select';
import {TaskStatusCodes} from '../../editor/task';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../utils/api-error';

@Component({
  selector: 'app-book-security-view',
  templateUrl: './book-security-view.component.html',
  styleUrls: ['./book-security-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSecurityViewComponent implements OnInit {
  apiError: ApiError;
  readonly Flag = BookPermissionFlag;
  private readonly subscriptions = new Subscription();
  book = new BehaviorSubject<BookCommunication>(undefined);
  private readonly _bookMeta = new BehaviorSubject<BookMeta>(new BookMeta());
  permissions = new BookPermissions();
  private availableUsers: RestAPIUser[] = [];
  private availableGroups: RestAPIGroup[] = [];

  availablePermissions: Array<{value: BookPermissionFlag, title: string, hint: string}> = [
    {value: BookPermissionFlag.RightsRead, title: 'Read', hint: 'Grant read access'},
    {value: BookPermissionFlag.RightsWrite, title: 'Write', hint: 'Grant read and write access'},
    {value: BookPermissionFlag.RightsMaintainer, title: 'Maintainer', hint: 'Grant full access to the book'},
    {value: BookPermissionFlag.RightsAdmin, title: 'Administrator', hint: 'Grant administrative access'},
  ];
  availableDefaultPermissions: Array<{value: BookPermissionFlag, title: string, hint: string}> = [
    {value: BookPermissionFlag.RightsNone, title: 'No access', hint: 'Access is forbidden'},
    ...this.availablePermissions.slice(0, 1),  // show no admin rights (Read)
    {value: BookPermissionFlag.RightsDemo, title: 'Demo access', hint: 'Grant read and demo edit access'},
    ...this.availablePermissions.slice(1, 2),  // show no admin rights (Write)
  ];

  get filteredUsers() { return this.availableUsers.filter(u => !this.permissions.users.has(u.username)); }
  get filteredGroups() { return this.availableGroups.filter(g => !this.permissions.groups.has(g.name)); }


  get bookMeta() { return this._bookMeta.getValue(); }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private changeDetector: ChangeDetectorRef,
  ) {
    this.subscriptions.add(this.book.pipe(filter(b => !!b)).subscribe(book => {
      this.http.get<BookMeta>(book.meta()).subscribe(res => this._bookMeta.next(res));
      this.http.get<any>(book.permissionsUrl()).subscribe(
        r => {
          this.permissions = BookPermissions.fromJson(r);
          this.changeDetector.markForCheck();
        }
      );
      this.http.get<{users: RestAPIUser[]}>(ServerUrls.auth('users')).subscribe(
        r => {
          this.availableUsers = r.users;
          this.changeDetector.markForCheck();
        }
      );
      this.http.get<{groups: RestAPIGroup[]}>(ServerUrls.auth('groups')).subscribe(
        r => {
          this.availableGroups = r.groups;
          this.changeDetector.markForCheck();
        }
      );
    }));
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.book.next(new BookCommunication(params.get('book_id')));
      });
  }


  ngOnInit() {
  }


  findGlobalPermissions(permissions: BookPermissionFlags) {
    if (!permissions) { return; }
    const rev = this.availablePermissions.slice().reverse();
    for (const p of rev) {
      if (permissions.has(p.value)) {
        return p;
      }
    }
  }

  // user
  // ---------------------------------------------------------------------------------------------------------------

  addUser(username: string) {
    if (!username) { return; }
    this.http.put<any>(this.book.getValue().permissionsUserUrl(username), {'flags': BookPermissionFlag.RightsRead})
      .subscribe(r => {
        this.permissions.users.set(username, BookPermissionFlags.fromJson(r));
        this.changeDetector.markForCheck();
      });
  }

  deleteUser(username: string) {
    if (!username) { return; }
    this.http.delete(this.book.getValue().permissionsUserUrl(username))
      .subscribe(r => {
        this.permissions.users.delete(username);
        this.changeDetector.markForCheck();
      });
  }

  userPermissionsChanged(username: string, event: MatSelectChange) {
    this.http.post<{flags: number}>(this.book.getValue().permissionsUserUrl(username), {flags: event.value.value}).subscribe(
      r => {
        this.permissions.users.get(username).flags = r.flags;
        event.source.value = this.permissionsOfUser(username);
        this.changeDetector.markForCheck();
      },
      e => {
        event.source.value = this.permissionsOfUser(username);
        this.changeDetector.markForCheck();
      }
    );
  }

  permissionsOfUser(username: string) {
    const userPerm = this.permissions.users.get(username);
    if (!userPerm) { return; }
    return this.findGlobalPermissions(userPerm);
  }

  // group
  // ---------------------------------------------------------------------------------------------------------------

  addGroup(name: string) {
    if (!name) { return; }
    this.http.put<any>(this.book.getValue().permissionsGroupUrl(name), {'flags': BookPermissionFlag.RightsRead})
      .subscribe(r => {
        this.permissions.groups.set(name, BookPermissionFlags.fromJson(r));
        this.changeDetector.markForCheck();
      });
  }

  deleteGroup(name: string) {
    if (!name) { return; }
    this.http.delete(this.book.getValue().permissionsGroupUrl(name))
      .subscribe(r => {
        this.permissions.groups.delete(name);
        this.changeDetector.markForCheck();
      });
  }

  groupPermissionsChanged(name: string, event: MatSelectChange) {
    this.http.post<{flags: number}>(this.book.getValue().permissionsGroupUrl(name), {flags: event.value.value}).subscribe(
      r => {
        this.permissions.groups.get(name).flags = r.flags;
        event.source.value = this.permissionsOfGroup(name);
        this.changeDetector.markForCheck();
      },
      e => {
        this.apiError = apiErrorFromHttpErrorResponse(e);
        event.source.value = this.permissionsOfGroup(name);
        this.changeDetector.markForCheck();
      }
    );
  }

  permissionsOfGroup(name: string) {
    const perm = this.permissions.groups.get(name);
    if (!perm) { return; }
    return this.findGlobalPermissions(perm);
  }

  // default
  // ---------------------------------------------------------------------------------------------------------------

  defaultPermissionsChanged(event: MatSelectChange) {
    this.http.post<{flags: number}>(this.book.getValue().permissionsDefaultUrl(), {flags: event.value.value}).subscribe(
      r => {
        this.permissions.other.flags = r.flags;
        event.source.value = this.defaultPermissions();
        this.changeDetector.markForCheck();
      },
      e => {
        this.apiError = apiErrorFromHttpErrorResponse(e);
        event.source.value = this.defaultPermissions();
        this.changeDetector.markForCheck();
      }
    );
  }

  defaultPermissions() {
    const rev = this.availableDefaultPermissions.slice().reverse();
    for (const p of rev) {
      if (this.permissions.other.has(p.value)) {
        return p;
      }
    }
  }
}
