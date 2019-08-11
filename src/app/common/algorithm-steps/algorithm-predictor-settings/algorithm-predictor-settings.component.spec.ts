import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlgorithmPredictorSettingsComponent } from './algorithm-predictor-settings.component';

describe('AlgorithmPredictorSettingsComponent', () => {
  let component: AlgorithmPredictorSettingsComponent;
  let fixture: ComponentFixture<AlgorithmPredictorSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AlgorithmPredictorSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlgorithmPredictorSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
