import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecuredImageComponent } from './secured-image.component';

describe('SecuredImageComponent', () => {
  let component: SecuredImageComponent;
  let fixture: ComponentFixture<SecuredImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecuredImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecuredImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
