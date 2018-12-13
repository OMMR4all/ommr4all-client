import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectStaffLinesDialogComponent } from './detect-stafflines-dialog.component';

describe('DetectStafflinesDialogComponent', () => {
  let component: DetectStaffLinesDialogComponent;
  let fixture: ComponentFixture<DetectStaffLinesDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectStaffLinesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectStaffLinesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
