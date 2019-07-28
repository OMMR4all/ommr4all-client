import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministrativeViewDefaultModelsComponent } from './administrative-view-default-models.component';

describe('AdministrativeViewDefaultModelsComponent', () => {
  let component: AdministrativeViewDefaultModelsComponent;
  let fixture: ComponentFixture<AdministrativeViewDefaultModelsComponent>;

  beforeEach(async(() => {
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
