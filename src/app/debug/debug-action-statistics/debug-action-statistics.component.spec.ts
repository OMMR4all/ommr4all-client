import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugActionStatisticsComponent } from './debug-action-statistics.component';

describe('DebugActionStatisticsComponent', () => {
  let component: DebugActionStatisticsComponent;
  let fixture: ComponentFixture<DebugActionStatisticsComponent>;

  beforeEach(async(() => {
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
