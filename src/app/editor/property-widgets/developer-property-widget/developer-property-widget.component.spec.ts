import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DeveloperPropertyWidgetComponent } from './developer-property-widget.component';

describe('DeveloperPropertyWidgetComponent', () => {
  let component: DeveloperPropertyWidgetComponent;
  let fixture: ComponentFixture<DeveloperPropertyWidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DeveloperPropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeveloperPropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
