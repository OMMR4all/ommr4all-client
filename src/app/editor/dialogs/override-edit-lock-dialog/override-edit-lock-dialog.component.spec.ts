import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverrideEditLockDialogComponent } from './override-edit-lock-dialog.component';

describe('OverrideEditLockDialogComponent', () => {
  let component: OverrideEditLockDialogComponent;
  let fixture: ComponentFixture<OverrideEditLockDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverrideEditLockDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverrideEditLockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
