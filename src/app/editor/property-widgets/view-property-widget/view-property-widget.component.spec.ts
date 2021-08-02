import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ViewPropertyWidgetComponent } from './view-property-widget.component';

describe('ViewPropertyWidgetComponent', () => {
  let component: ViewPropertyWidgetComponent;
  let fixture: ComponentFixture<ViewPropertyWidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewPropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewPropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
