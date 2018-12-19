import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmCleanAllPagesDialogComponent } from './confirm-clean-all-pages-dialog.component';

describe('ConfirmCleanAllPagesDialogComponent', () => {
  let component: ConfirmCleanAllPagesDialogComponent;
  let fixture: ComponentFixture<ConfirmCleanAllPagesDialogComponent>;

  beforeEach(async(() => {
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
