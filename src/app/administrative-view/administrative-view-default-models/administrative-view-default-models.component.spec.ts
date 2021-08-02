import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdministrativeViewDefaultModelsComponent } from './administrative-view-default-models.component';

describe('AdministrativeViewDefaultModelsComponent', () => {
  let component: AdministrativeViewDefaultModelsComponent;
  let fixture: ComponentFixture<AdministrativeViewDefaultModelsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdministrativeViewDefaultModelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministrativeViewDefaultModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
