import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonodiLoginDialogComponent } from './monodi-login-dialog.component';

describe('MonodiLoginDialogComponent', () => {
  let component: MonodiLoginDialogComponent;
  let fixture: ComponentFixture<MonodiLoginDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonodiLoginDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonodiLoginDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
