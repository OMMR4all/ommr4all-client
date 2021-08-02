import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  GenericProgressBarDialogComponent,
} from './generic-progress-bar-dialog.component';

describe('OverrideEditLockDialogComponent', () => {
  let component: GenericProgressBarDialogComponent;
  let fixture: ComponentFixture<GenericProgressBarDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GenericProgressBarDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericProgressBarDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
