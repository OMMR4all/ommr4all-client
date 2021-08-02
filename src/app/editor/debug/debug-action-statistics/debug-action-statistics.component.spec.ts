import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DebugActionStatisticsComponent } from './debug-action-statistics.component';

describe('DebugActionStatisticsComponent', () => {
  let component: DebugActionStatisticsComponent;
  let fixture: ComponentFixture<DebugActionStatisticsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DebugActionStatisticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DebugActionStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
