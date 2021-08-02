import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ServerStateComponent } from './server-state.component';

describe('ServerStateComponent', () => {
  let component: ServerStateComponent;
  let fixture: ComponentFixture<ServerStateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
