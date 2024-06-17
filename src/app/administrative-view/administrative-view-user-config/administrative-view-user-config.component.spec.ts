import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministrativeViewUserConfigComponent } from './administrative-view-user-config.component';

describe('AdministrativeViewUserConfigComponent', () => {
  let component: AdministrativeViewUserConfigComponent;
  let fixture: ComponentFixture<AdministrativeViewUserConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdministrativeViewUserConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministrativeViewUserConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
