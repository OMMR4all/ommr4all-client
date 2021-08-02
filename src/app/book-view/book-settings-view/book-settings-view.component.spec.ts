import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookSettingsViewComponent } from './book-settings-view.component';

describe('BookSettingsViewComponent', () => {
  let component: BookSettingsViewComponent;
  let fixture: ComponentFixture<BookSettingsViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookSettingsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookSettingsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
