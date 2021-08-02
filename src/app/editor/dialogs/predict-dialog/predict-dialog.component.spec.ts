import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PredictDialogComponent } from './predict-dialog.component';

describe('PredictDialogComponent', () => {
  let component: PredictDialogComponent;
  let fixture: ComponentFixture<PredictDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PredictDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PredictDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
