import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlgorithmTypeForGroupSelectionComponent } from './algorithm-type-for-group-selection.component';

describe('AlgorithmTypeForGroupSelectionComponent', () => {
  let component: AlgorithmTypeForGroupSelectionComponent;
  let fixture: ComponentFixture<AlgorithmTypeForGroupSelectionComponent>;

  beforeEach(async(() => {
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
