import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ApiErrorCardComponent } from './api-error-card.component';

describe('ApiErrorCardComponent', () => {
  let component: ApiErrorCardComponent;
  let fixture: ComponentFixture<ApiErrorCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApiErrorCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiErrorCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
