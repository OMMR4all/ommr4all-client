import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministrativeViewComponent } from './administrative-view.component';

describe('AdministrativeViewComponent', () => {
  let component: AdministrativeViewComponent;
  let fixture: ComponentFixture<AdministrativeViewComponent>;

  beforeEach(async(() => {
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
