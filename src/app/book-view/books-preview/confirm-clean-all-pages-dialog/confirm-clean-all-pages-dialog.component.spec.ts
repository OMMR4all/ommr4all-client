import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfirmCleanAllPagesDialogComponent } from './confirm-clean-all-pages-dialog.component';

describe('ConfirmCleanAllPagesDialogComponent', () => {
  let component: ConfirmCleanAllPagesDialogComponent;
  let fixture: ComponentFixture<ConfirmCleanAllPagesDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmCleanAllPagesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmCleanAllPagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
