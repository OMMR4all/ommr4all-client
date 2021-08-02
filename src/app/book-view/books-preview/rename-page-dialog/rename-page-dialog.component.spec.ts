import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RenamePageDialogComponent } from './rename-page-dialog.component';

describe('RenamePageDialogComponent', () => {
  let component: RenamePageDialogComponent;
  let fixture: ComponentFixture<RenamePageDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RenamePageDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RenamePageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
