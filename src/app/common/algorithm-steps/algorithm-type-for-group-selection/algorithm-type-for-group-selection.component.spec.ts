import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AlgorithmTypeForGroupSelectionComponent } from './algorithm-type-for-group-selection.component';

describe('AlgorithmTypeForGroupSelectionComponent', () => {
  let component: AlgorithmTypeForGroupSelectionComponent;
  let fixture: ComponentFixture<AlgorithmTypeForGroupSelectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AlgorithmTypeForGroupSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlgorithmTypeForGroupSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
