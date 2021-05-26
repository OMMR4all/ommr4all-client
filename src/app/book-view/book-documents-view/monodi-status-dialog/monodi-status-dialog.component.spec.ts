import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonodiStatusDialogComponent } from './monodi-status-dialog.component';

describe('MonodiStatusDialogComponent', () => {
  let component: MonodiStatusDialogComponent;
  let fixture: ComponentFixture<MonodiStatusDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonodiStatusDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonodiStatusDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
