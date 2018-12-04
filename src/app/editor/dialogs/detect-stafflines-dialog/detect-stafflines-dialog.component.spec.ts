import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectStafflinesDialogComponent } from './detect-stafflines-dialog.component';

describe('DetectStafflinesDialogComponent', () => {
  let component: DetectStafflinesDialogComponent;
  let fixture: ComponentFixture<DetectStafflinesDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectStafflinesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectStafflinesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
