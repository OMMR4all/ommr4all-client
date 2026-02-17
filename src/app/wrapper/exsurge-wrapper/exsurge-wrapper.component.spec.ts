import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExsurgeWrapperComponent } from './exsurge-wrapper.component';

describe('ExsurgeWrapperComponent', () => {
  let component: ExsurgeWrapperComponent;
  let fixture: ComponentFixture<ExsurgeWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExsurgeWrapperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExsurgeWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
