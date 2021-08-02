import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdministrativeViewTasksComponent } from './administrative-view-tasks.component';

describe('AdministrativeViewTasksComponent', () => {
  let component: AdministrativeViewTasksComponent;
  let fixture: ComponentFixture<AdministrativeViewTasksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdministrativeViewTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministrativeViewTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
