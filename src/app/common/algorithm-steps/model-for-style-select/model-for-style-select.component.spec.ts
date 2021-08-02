import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModelForStyleSelectComponent } from './model-for-style-select.component';

describe('ModelForStyleSelectComponent', () => {
  let component: ModelForStyleSelectComponent;
  let fixture: ComponentFixture<ModelForStyleSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelForStyleSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelForStyleSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
