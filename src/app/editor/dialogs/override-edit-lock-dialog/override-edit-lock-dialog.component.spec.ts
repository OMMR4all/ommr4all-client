import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OverrideEditLockDialogComponent } from './override-edit-lock-dialog.component';

describe('OverrideEditLockDialogComponent', () => {
  let component: OverrideEditLockDialogComponent;
  let fixture: ComponentFixture<OverrideEditLockDialogComponent>;

  beforeEach(waitForAsync(() => {
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
