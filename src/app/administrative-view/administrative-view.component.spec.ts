import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdministrativeViewComponent } from './administrative-view.component';

describe('AdministrativeViewComponent', () => {
  let component: AdministrativeViewComponent;
  let fixture: ComponentFixture<AdministrativeViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdministrativeViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministrativeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
