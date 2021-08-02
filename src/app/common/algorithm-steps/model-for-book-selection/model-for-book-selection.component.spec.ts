import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModelForBookSelectionComponent } from './model-for-book-selection.component';

describe('ModelForBookSelectionComponent', () => {
  let component: ModelForBookSelectionComponent;
  let fixture: ComponentFixture<ModelForBookSelectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelForBookSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelForBookSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
