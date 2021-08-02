import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfirmDeletePageDialogComponent } from './confirm-delete-page-dialog.component';

describe('ConfirmDeletePageDialogComponent', () => {
  let component: ConfirmDeletePageDialogComponent;
  let fixture: ComponentFixture<ConfirmDeletePageDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmDeletePageDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDeletePageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
